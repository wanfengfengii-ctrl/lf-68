from datetime import datetime
from api.models import db, FilterRecord
from api.utils import NotFoundError, BusinessRuleError
from api.services.batch_service import get_batch_by_id, determine_status, generate_id
from api.services.analysis_service import run_full_analysis

def get_filter_records(batch_id):
    batch = get_batch_by_id(batch_id)
    records = FilterRecord.query.filter_by(batch_id=batch_id).order_by(FilterRecord.filter_date.asc()).all()
    return [r.to_dict() for r in records]

def add_filter_record(batch_id, data):
    batch = get_batch_by_id(batch_id)
    
    if data.filterDate < batch.soak_start_date:
        raise BusinessRuleError('过滤日期不能早于浸泡开始日期', 'filter_date')
    
    record = FilterRecord(
        id=generate_id('filter'),
        batch_id=batch_id,
        filter_date=data.filterDate,
        filter_method=data.filterMethod,
        filter_count=data.filterCount,
        notes=data.notes
    )
    
    batch.filter_count = data.filterCount
    batch.status = determine_status(batch)
    batch.updated_at = datetime.now()
    
    db.session.add(record)
    db.session.commit()
    
    run_full_analysis(batch_id)
    
    return record.to_dict()
