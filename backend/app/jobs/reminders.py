import uuid
from datetime import datetime, date, timezone, timedelta
from backend.app.db.client import db
from backend.app.modules.reminders.email import send_reminder_email
import logging

logger = logging.getLogger(__name__)

async def check_and_send_reminders():
    # Query active or overdue agreements
    agreements = await db.agreements.find({"status": {"$in": ["active", "overdue"]}}).to_list(length=1000)
    
    for agreement in agreements:
        try:
            item = await db.items.find_one({"_id": agreement["item_id"]})
            if not item:
                continue
                
            borrower_id = agreement.get("borrower_id")
            if not borrower_id:
                continue
                
            borrower = await db.users.find_one({"_id": borrower_id})
            borrower_name = borrower.get("full_name", "Borrower") if borrower else "Borrower"
            
            due_date_raw = agreement["terms"]["due_date"]
            if isinstance(due_date_raw, datetime):
                due_date = due_date_raw.date()
            elif isinstance(due_date_raw, date):
                due_date = due_date_raw
            else:
                try:
                    # If stored as string
                    due_date = datetime.strptime(str(due_date_raw).split("T")[0], "%Y-%m-%d").date()
                except Exception:
                    continue
                    
            days_until = (due_date - datetime.now(timezone.utc).date()).days
            
            reminder_type = None
            msg = ""
            
            if days_until == 7:
                reminder_type = "reminder_7d"
                msg = f"Reminder: '{item['title']}' is due in 7 days"
            elif days_until == 3:
                reminder_type = "reminder_3d"
                msg = f"3 days left to return '{item['title']}'"
            elif days_until == 1:
                reminder_type = "reminder_1d"
                msg = f"Tomorrow: return '{item['title']}'"
            elif days_until == 0:
                reminder_type = "due_today"
                msg = f"Due today: '{item['title']}'"
            elif days_until < 0:
                if agreement["status"] == "active":
                    # Transition status to overdue
                    await db.agreements.update_one(
                        {"_id": agreement["_id"]},
                        {"$set": {"status": "overdue", "updated_at": datetime.now(timezone.utc)}}
                    )
                    
                    # Log status history entry
                    history_entry = {
                        "from_status": "active",
                        "to_status": "overdue",
                        "changed_by": "system",
                        "note": "Agreement marked overdue by system scheduler",
                        "created_at": datetime.now(timezone.utc)
                    }
                    await db.agreements.update_one(
                        {"_id": agreement["_id"]},
                        {"$push": {"status_history": history_entry}}
                    )
                    
                reminder_type = "overdue"
                msg = f"OVERDUE: '{item['title']}' is late"
                    
            if reminder_type:
                # For overdue reminders, allow sending once per 24 hours
                if reminder_type == "overdue":
                    cutoff = datetime.now(timezone.utc) - timedelta(hours=23)
                    already_sent = await db.notifications.find_one({
                        "user_id": borrower_id,
                        "agreement_id": agreement["_id"],
                        "type": "overdue",
                        "created_at": {"$gte": cutoff}
                    })
                else:
                    # For countdown reminders (7d, 3d, 1d, due_today), send once
                    already_sent = await db.notifications.find_one({
                        "user_id": borrower_id,
                        "agreement_id": agreement["_id"],
                        "type": reminder_type
                    })
                if not already_sent:
                    # Send reminder email via SMTP
                    try:
                        await send_reminder_email(
                            to_email=agreement["borrower_email"],
                            borrower_name=borrower_name,
                            item_name=item["title"],
                            due_date=due_date,
                            reminder_type=reminder_type,
                            agreement_id=agreement["_id"]
                        )
                    except Exception as send_err:
                        logger.error(f"Failed to dispatch reminder email to {agreement.get('borrower_email')}: {send_err}")
                    
                    # Save notification doc
                    notif_doc = {
                        "_id": uuid.uuid4().hex,
                        "user_id": borrower_id,
                        "agreement_id": agreement["_id"],
                        "type": reminder_type,
                        "message": msg,
                        "is_read": False,
                        "sent_at": datetime.now(timezone.utc),
                        "created_at": datetime.now(timezone.utc)
                    }
                    await db.notifications.insert_one(notif_doc)
        except Exception as item_err:
            logger.error(f"Error processing reminder for agreement {agreement.get('_id')}: {item_err}")
            
    # Cancel notifications for completed agreements
    completed_agreements = await db.agreements.find({"status": "completed"}).to_list(length=1000)
    completed_ids = [ag["_id"] for ag in completed_agreements]
    if completed_ids:
        await db.notifications.update_many(
            {"agreement_id": {"$in": completed_ids}, "is_read": False},
            {"$set": {"is_read": True}}
        )
