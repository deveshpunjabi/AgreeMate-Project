import pytest
from datetime import datetime, timedelta, timezone
from backend.app.modules.penalties.engine import calculate_current_penalty

def get_today_date():
    return datetime.now(timezone.utc).date()

def test_fixed_penalty_no_grace():
    # 5 days late, fixed fee
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=5),
            "penalty_type": "fixed",
            "penalty_rate": 500.0,
            "grace_period_days": 0
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 5
    assert res["billable_days"] == 5
    assert res["calculated_amount"] == 500.0
    assert "Fixed fee of ₹500.00" in res["formula_snapshot"]

def test_fixed_penalty_within_grace():
    # 2 days late, grace period 3 days -> 0 penalty
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=2),
            "penalty_type": "fixed",
            "penalty_rate": 500.0,
            "grace_period_days": 3
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 2
    assert res["billable_days"] == 0
    assert res["calculated_amount"] == 0.0

def test_fixed_penalty_outside_grace():
    # 5 days late, grace period 3 days -> apply fixed fee
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=5),
            "penalty_type": "fixed",
            "penalty_rate": 500.0,
            "grace_period_days": 3
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 5
    assert res["billable_days"] == 2
    assert res["calculated_amount"] == 500.0

def test_per_day_penalty_no_grace():
    # 4 days late, 100/day
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=4),
            "penalty_type": "per_day",
            "penalty_rate": 100.0,
            "grace_period_days": 0
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 4
    assert res["billable_days"] == 4
    assert res["calculated_amount"] == 400.0
    assert "₹100.00/day x 4 billable days = ₹400.00" in res["formula_snapshot"]

def test_per_day_penalty_within_grace():
    # 3 days late, grace period 5 days -> 0 penalty
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=3),
            "penalty_type": "per_day",
            "penalty_rate": 100.0,
            "grace_period_days": 5
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 3
    assert res["billable_days"] == 0
    assert res["calculated_amount"] == 0.0

def test_per_day_penalty_outside_grace():
    # 6 days late, grace period 2 days -> 4 days late * 100 = 400
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=6),
            "penalty_type": "per_day",
            "penalty_rate": 100.0,
            "grace_period_days": 2
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 6
    assert res["billable_days"] == 4
    assert res["calculated_amount"] == 400.0

def test_percentage_penalty_no_grace():
    # 10 days late, 2% of 1000 item value per day -> 20/day * 10 days = 200
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=10),
            "penalty_type": "percentage",
            "penalty_rate": 2.0,
            "grace_period_days": 0
        }
    }
    item = {"estimated_value": 1000.0}
    res = calculate_current_penalty(agreement, item)
    assert res["overdue_days"] == 10
    assert res["billable_days"] == 10
    assert res["calculated_amount"] == 200.0
    assert "2.00% of ₹1000.00 (₹20.00/day) x 10 days = ₹200.00" in res["formula_snapshot"]

def test_percentage_penalty_with_grace():
    # 10 days late, 2 days grace -> 8 billable days * 2% of 1000 = 160
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=10),
            "penalty_type": "percentage",
            "penalty_rate": 2.0,
            "grace_period_days": 2
        }
    }
    item = {"estimated_value": 1000.0}
    res = calculate_current_penalty(agreement, item)
    assert res["overdue_days"] == 10
    assert res["billable_days"] == 8
    assert res["calculated_amount"] == 160.0

def test_percentage_missing_item_estimated_value():
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=5),
            "penalty_type": "percentage",
            "penalty_rate": 2.0,
            "grace_period_days": 0
        }
    }
    with pytest.raises(ValueError) as excinfo:
        calculate_current_penalty(agreement, None)
    assert "Estimated value is required" in str(excinfo.value)

def test_percentage_missing_value_in_item_dict():
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() - timedelta(days=5),
            "penalty_type": "percentage",
            "penalty_rate": 2.0,
            "grace_period_days": 0
        }
    }
    item = {"estimated_value": None}
    with pytest.raises(ValueError) as excinfo:
        calculate_current_penalty(agreement, item)
    assert "Estimated value is required" in str(excinfo.value)

def test_inactive_status_no_penalty():
    # Due in past, but status is 'draft'
    agreement = {
        "status": "draft",
        "terms": {
            "due_date": get_today_date() - timedelta(days=5),
            "penalty_type": "fixed",
            "penalty_rate": 500.0,
            "grace_period_days": 0
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 0
    assert res["billable_days"] == 0
    assert res["calculated_amount"] == 0.0

def test_future_due_date_no_penalty():
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date() + timedelta(days=5),
            "penalty_type": "fixed",
            "penalty_rate": 500.0,
            "grace_period_days": 0
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 0
    assert res["billable_days"] == 0
    assert res["calculated_amount"] == 0.0

def test_today_due_date_no_penalty():
    agreement = {
        "status": "active",
        "terms": {
            "due_date": get_today_date(),
            "penalty_type": "fixed",
            "penalty_rate": 500.0,
            "grace_period_days": 0
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 0
    assert res["billable_days"] == 0
    assert res["calculated_amount"] == 0.0

def test_datetime_due_date_handling():
    # Should handle datetime object successfully by converting to date
    agreement = {
        "status": "active",
        "terms": {
            "due_date": datetime.now(timezone.utc) - timedelta(days=3),
            "penalty_type": "fixed",
            "penalty_rate": 200.0,
            "grace_period_days": 0
        }
    }
    res = calculate_current_penalty(agreement, None)
    assert res["overdue_days"] == 3
    assert res["calculated_amount"] == 200.0

def test_missing_terms_raises_value_error():
    agreement = {
        "status": "active"
    }
    with pytest.raises(ValueError) as excinfo:
        calculate_current_penalty(agreement, None)
    assert "Agreement terms are missing" in str(excinfo.value)

def test_invalid_due_date_raises_value_error():
    agreement = {
        "status": "active",
        "terms": {
            "due_date": "not-a-date",
            "penalty_type": "fixed",
            "penalty_rate": 100.0
        }
    }
    with pytest.raises(ValueError) as excinfo:
        calculate_current_penalty(agreement, None)
    assert "Invalid due date type" in str(excinfo.value)
