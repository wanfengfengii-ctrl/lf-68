from flask import Blueprint, request, jsonify
from api.services import (
    get_dyeing_records,
    get_dyeing_record_detail,
    add_dyeing_record,
    update_dyeing_record,
    delete_dyeing_record,
    trace_dyeing_process,
    analyze_recipe_stability,
    get_recipe_recommendation
)
from api.utils import DyeingRecordCreate, DyeingRecordUpdate, handle_validation_error

bp = Blueprint('dyeing_records', __name__)

@bp.route('/dyeing-records', methods=['GET'])
def list_dyeing_records():
    batch_id = request.args.get('batchId')
    fabric_type = request.args.get('fabricType')
    target_color = request.args.get('targetColor')
    process = request.args.get('process')
    
    records = get_dyeing_records(
        batch_id=batch_id,
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    return jsonify(records)

@bp.route('/dyeing-records/<record_id>', methods=['GET'])
def get_dyeing_record(record_id):
    record = get_dyeing_record_detail(record_id)
    return jsonify(record)

@bp.route('/<batch_id>/dyeing-records', methods=['POST'])
def add_dyeing_record_route(batch_id):
    try:
        data = DyeingRecordCreate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    record = add_dyeing_record(batch_id, data)
    return jsonify(record), 201

@bp.route('/dyeing-records/<record_id>', methods=['PUT'])
def update_dyeing_record_route(record_id):
    try:
        data = DyeingRecordUpdate(**request.get_json())
    except Exception as e:
        return handle_validation_error(e)
    record = update_dyeing_record(record_id, data)
    return jsonify(record)

@bp.route('/dyeing-records/<record_id>', methods=['DELETE'])
def delete_dyeing_record_route(record_id):
    delete_dyeing_record(record_id)
    return jsonify({'message': '删除成功'})

@bp.route('/dyeing-records/trace', methods=['GET'])
def trace_process():
    fabric_type = request.args.get('fabricType')
    target_color = request.args.get('targetColor')
    process = request.args.get('process')
    
    result = trace_dyeing_process(
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    return jsonify(result)

@bp.route('/dyeing-records/analyze/stability', methods=['GET'])
def analyze_stability():
    fabric_type = request.args.get('fabricType')
    target_color = request.args.get('targetColor')
    process = request.args.get('process')
    
    result = analyze_recipe_stability(
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    return jsonify(result)

@bp.route('/dyeing-records/recommend', methods=['GET'])
def get_recommendation():
    fabric_type = request.args.get('fabricType')
    target_color = request.args.get('targetColor')
    process = request.args.get('process')
    
    if not fabric_type or not target_color:
        return jsonify({
            'error': '请提供布料类型和目标颜色',
            'code': 400
        }), 400
    
    result = get_recipe_recommendation(
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    return jsonify(result)
