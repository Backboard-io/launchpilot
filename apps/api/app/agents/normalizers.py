from __future__ import annotations


def normalize_list_of_dicts(value) -> list[dict]:
    if not value:
        return []
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    return []
