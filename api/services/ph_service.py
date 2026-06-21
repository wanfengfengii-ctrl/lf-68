from datetime import datetime
from api.models import db, PhRecord
from api.utils import NotFoundError, BusinessRuleError
from api.services.batch_service import get_batch_by_id, get_applicability, determine_status, generate_id
from api.services.analysis_service import run_full_analysis

def get_ph_records(batch_id):
    batch = get_batch_by_id(batch_id)
    records = PhRecord.query.filter_by(batch_id=batch_id).order_by(PhRecord.measured_at.asc()).all()
    return [r.to_dict() for r in records]

def add_ph_record(batch_id, data):
    batch = get_batch_by_id(batch_id)
    
    record = PhRecord(
        id=generate_id('ph'),
        batch_id=batch_id,
        ph_value=data.phValue,
        measured_at=data.measuredAt,
        measured_by=data.measuredBy,
        notes=data.notes
    )
    
    batch.current_ph = data.phValue
    batch.is_applicable, batch.applicable_processes = get_applicability(data.phValue)
    batch.status = determine_status(batch)
    batch.updated_at = datetime.now()
    batch.last_ph_check_time = data.measuredAt if hasattr(data, 'measuredAt') and data.measuredAt else datetime.now()
    
    db.session.add(record)
    db.session.commit()
    
    run_full_analysis(batch_id)
    
    return record.to_dict()
