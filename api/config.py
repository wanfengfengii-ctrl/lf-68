import os
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{os.path.join(PROJECT_ROOT, "data", "ash_water.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False

    PH_MIN = 0.0
    PH_MAX = 14.0
    APPLICABLE_PH_MIN = 8.5
    APPLICABLE_PH_MAX = 12.5
    MIN_SOAK_DURATION_HOURS = 1

    PROCESS_PH_RANGES = {
        'scouring': (10.0, 12.0),
        'mordanting': (10.0, 12.0),
        'dyeing': (9.0, 11.0),
        'fixing': (8.0, 10.0)
    }

    PROCESS_NAMES = {
        'scouring': '精练',
        'mordanting': '媒染',
        'dyeing': '染色',
        'fixing': '固色'
    }

    STATUS_NAMES = {
        'soaking': '浸泡中',
        'filtering': '过滤中',
        'available': '可用',
        'not_applicable': '不适用',
        'exhausted': '已用尽',
        'warning': '预警中'
    }

    WARNING_CONFIG = {
        'consecutive_abnormal_threshold': 3,
        'max_hours_since_last_ph': 72,
        'ph_trend_window': 5,
        'ph_stable_threshold': 0.3,
        'ph_rapid_change_threshold': 1.0,
        'ph_rapid_change_hours': 24,
    }

    WARNING_TYPES = {
        'consecutive_abnormal': 'PH连续异常',
        'long_time_no_check': '长期未检测',
        'ph_rising_rapidly': 'PH快速上升',
        'ph_falling_rapidly': 'PH快速下降',
        'usage_restricted': '限制使用',
    }

    WARNING_LEVELS = {
        'low': '提示',
        'medium': '警告',
        'high': '严重',
    }

    MORDANT_METHODS = {
        'alum': '明矾媒染',
        'iron': '铁媒染',
        'tannin': '单宁媒染',
        'copper': '铜媒染',
        'tin': '锡媒染',
        'chrome': '铬媒染',
        'pre_mordant': '预媒染',
        'meta_mordant': '同媒染',
        'post_mordant': '后媒染',
        'none': '无媒染',
    }

    DYE_MATERIALS = {
        'indigo': '靛蓝',
        'madder': '茜草',
        'safflower': '红花',
        'turmeric': '姜黄',
        'gardenia': '栀子',
        'sappanwood': '苏木',
        'pomegranate': '石榴皮',
        'chestnut': '板栗壳',
        'tea': '茶叶',
        'onion_skin': '洋葱皮',
        'grape_skin': '葡萄皮',
        'blueberry': '蓝莓',
        'spinach': '菠菜',
        'carrot': '胡萝卜',
        'other': '其他',
    }

    FABRIC_TYPES = {
        'cotton': '棉布',
        'linen': '亚麻',
        'silk': '丝绸',
        'wool': '羊毛',
        'hemp': '大麻',
        'ramie': '苎麻',
        'viscose': '粘胶纤维',
        'modal': '莫代尔',
        'tencel': '天丝',
        'bamboo': '竹纤维',
        'soy': '大豆纤维',
        'blend': '混纺',
        'other': '其他',
    }

    STABILITY_LEVELS = {
        'excellent': '优秀',
        'good': '良好',
        'fair': '一般',
        'poor': '较差',
        'unstable': '不稳定',
    }
