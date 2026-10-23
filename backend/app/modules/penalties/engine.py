from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Any

def to_decimal(val: Any) -> Decimal:
    if val is None:
        return Decimal("0.00")
    try:
        return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return Decimal("0.00")

def calculate_current_penalty(agreement: dict, item: Optional[dict]) -> dict:
    terms = agreement.get("terms")
    if not terms:
        raise ValueError("Agreement terms are missing")

    today = datetime.now(timezone.utc).date()
    due_date_raw = terms.get("due_date")

    if isinstance(due_date_raw, datetime):
        due_date = due_date_raw.date()
    elif isinstance(due_date_raw, date):
        due_date = due_date_raw
    else:
        raise ValueError("Invalid due date type")

    overdue_days = 0
    billable_days = 0
    calculated_amount_dec = Decimal("0.00")
    formula_snapshot = "No penalty accrued"

    agreement_status = agreement.get("status")
    if today > due_date and agreement_status in ["active", "overdue", "return_initiated", "disputed"]:
        overdue_days = (today - due_date).days
        grace_period_days = max(0, int(terms.get("grace_period_days") or 0))
        billable_days = max(0, overdue_days - grace_period_days)

        if billable_days > 0:
            penalty_type = terms.get("penalty_type")
            penalty_rate_dec = max(Decimal("0.00"), to_decimal(terms.get("penalty_rate", 0.0)))

            if penalty_type == "fixed":
                calculated_amount_dec = penalty_rate_dec
                formula_snapshot = f"Fixed fee of ₹{penalty_rate_dec:.2f} applied after {grace_period_days} days grace"
            elif penalty_type == "per_day":
                calculated_amount_dec = (penalty_rate_dec * Decimal(billable_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                formula_snapshot = f"₹{penalty_rate_dec:.2f}/day x {billable_days} billable days = ₹{calculated_amount_dec:.2f}"
            elif penalty_type == "percentage":
                est_val_raw = item.get("estimated_value") if item else None
                if est_val_raw is None:
                    raise ValueError("Estimated value is required for percentage penalty calculation")
                est_val_dec = max(Decimal("0.00"), to_decimal(est_val_raw))
                daily_fee = ((penalty_rate_dec / Decimal("100.00")) * est_val_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                calculated_amount_dec = (daily_fee * Decimal(billable_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                formula_snapshot = f"{penalty_rate_dec:.2f}% of ₹{est_val_dec:.2f} (₹{daily_fee:.2f}/day) x {billable_days} days = ₹{calculated_amount_dec:.2f}"

            # Apply maximum penalty cap if defined in terms
            max_penalty = terms.get("max_penalty")
            if max_penalty is not None:
                max_dec = max(Decimal("0.00"), to_decimal(max_penalty))
                if calculated_amount_dec > max_dec:
                    calculated_amount_dec = max_dec
                    formula_snapshot += f" (Capped at maximum penalty ₹{max_dec:.2f})"

    return {
        "agreement_id": str(agreement.get("_id")) if agreement.get("_id") else None,
        "overdue_days": overdue_days,
        "grace_period_days": terms.get("grace_period_days", 0),
        "billable_days": billable_days,
        "penalty_type": terms.get("penalty_type"),
        "penalty_rate": terms.get("penalty_rate"),
        "calculated_amount": float(calculated_amount_dec),
        "formula_snapshot": formula_snapshot
    }
