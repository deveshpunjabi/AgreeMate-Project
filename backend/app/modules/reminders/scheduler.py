import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.app.jobs.reminders import check_and_send_reminders


logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def start_scheduler():
    # Register daily job: check_and_send_reminders() runs at 09:00 every day
    if scheduler.get_job("daily-reminders") is None:
        scheduler.add_job(check_and_send_reminders, "cron", hour=9, minute=0, id="daily-reminders")

    if not scheduler.running:
        scheduler.start()
        logger.info("AgreeMate reminders scheduler started.")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("AgreeMate reminders scheduler shutdown.")
