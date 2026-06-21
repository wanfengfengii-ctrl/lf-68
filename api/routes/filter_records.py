from flask import Blueprint, request, jsonify
from api.services import get_filter_records, add_filter_record
from api.utils import FilterRecordCreate, handle_validation_error

bp = Blueprint('filter_records', __name__)

@bp.route('/<batch_id>/filter-records', methods=['GET'])
def list_filter_records(batch_id):
    records = get_filter_records(batch_id)
    return jsonify(records)

@bp.route('/<batch_id>/filter-records', methods=['POST'])
def add_filter_record_route(batch_id):
    try:
        data = FilterRecordCreate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    record = add_filter_record(batch_id, data)
    return jsonify(record), 201
