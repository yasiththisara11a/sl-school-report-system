from typing import Optional, List, Dict

def calculate_sl_grade(score: Optional[int], is_absent: bool = False) -> str:
    if is_absent or score is None:
        return "AB"
    if score >= 75:
        return "A"
    if score >= 65:
        return "B"
    if score >= 50:
        return "C"
    if score >= 35:
        return "S"
    return "W"

def compute_class_rankings(student_totals: List[Dict]) -> List[Dict]:
    sorted_students = sorted(student_totals, key=lambda x: x["total_marks"], reverse=True)
    
    current_rank = 1
    for i, student in enumerate(sorted_students):
        if i > 0 and student["total_marks"] < sorted_students[i - 1]["total_marks"]:
            current_rank = i + 1
        student["class_rank"] = current_rank
        
    return sorted_students