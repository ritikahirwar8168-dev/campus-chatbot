THRESHOLD = 75.0


def percentage(present: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((present / total) * 100, 1)


def classes_to_reach(present: int, total: int, target: float = THRESHOLD) -> int:
    if total <= 0:
        return 0
    if percentage(present, total) >= target:
        return 0
    needed = 0
    p, t = present, total
    while percentage(p, t) < target:
        p += 1
        t += 1
        needed += 1
        if needed > 200:
            break
    return needed


def simulate(present: int, total: int, extra_absences: int = 0, extra_classes: int = 0) -> dict:
    new_present = present + extra_classes
    new_total = total + extra_absences + extra_classes
    pct = percentage(new_present, new_total)
    return {
        "present": new_present,
        "total": new_total,
        "percentage": pct,
        "warning": pct < THRESHOLD,
        "classes_to_reach_75": classes_to_reach(new_present, new_total),
        "extra_absences": extra_absences,
        "extra_classes": extra_classes,
    }
