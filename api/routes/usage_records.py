from flask import Blueprint, request, jsonify
from api.services import get_usage_records, add_usage_record
from api.utils import UsageRecordCreate, handle_validation_error

bp = Blueprint('usage_records', __name__)

@bp.route('/<batch_id>/usage-records', methods=['GET'])
def list_usage_records(batch_id):
    records = get_usage_records(batch_id)
    return jsonify(records)

@bp.route('/<batch_id>/usage-records', methods=['POST'])
def add_usage_record_route(batch_id):
    try:
        data = UsageRecordCreate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    record = add_usage_record(batch_id, data)
    return jsonify(record), 201
