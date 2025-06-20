import os
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.units import mm

def draw_payslip_page(pdf: Canvas, employee: dict, commission: float, year: int = None, month: int = None):
    width, height = A4

    # Optional background
    background_image_path = os.path.join(settings.STATIC_ROOT, 'payslip.png')
    if os.path.exists(background_image_path):
        pdf.drawImage(background_image_path, 0, 0, width, height)

    margin_left = 17 * mm
    margin_top = height - 60 * mm
    line_height = 20

    # Draw employee info
    pdf.setFont("Helvetica-Bold", 20)
    user = employee.get("user", {})
    full_name = f"{user.get('last_name', '')} {user.get('first_name', '')}"
    payroll_period = f"{year}-{str(month).zfill(2)}" if year and month else ""

    info_top = margin_top - 25
    pdf.drawString(margin_left, info_top, f"{full_name}")

    # Financial details
    base_salary = float(employee.get("base_salary") or 0)
    bonus_payment = float(employee.get("bonus_payment") or 0)
    year_end_bonus = float(employee.get("year_end_bonus") or 0)
    transportation_allowance = float(employee.get("transportation_allowance") or 0)
    mpf_exempt = employee.get("is_mpf_exempt", False)
    mpf_deduction_rate = 0 if mpf_exempt else 0.05

    gross_payment = base_salary + bonus_payment + transportation_allowance + commission + year_end_bonus
    mpf_deduction_amount = gross_payment * mpf_deduction_rate
    net_payment = gross_payment - mpf_deduction_amount

    # Section positioning
    box_top = info_top - 100
    box_width = 520

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(margin_left + 5, box_top + 10, "Payment Summary")

    # Build values list, only showing non-zero financial components (except always show Gross, MPF, Net)
    values = []

    if base_salary != 0:
        values.append(("Base Salary", base_salary))
    if transportation_allowance != 0:
        values.append(("Transportation Allowance", transportation_allowance))
    if year_end_bonus > 0:
        values.append(("Year End Bonus", year_end_bonus))

    if commission > 0:
        values.append(("Commission", (commission + bonus_payment)))

    # Always show these:
    values.append(("Gross Payment", gross_payment))

    if not mpf_exempt:
        values.append(("MPF Deduction", mpf_deduction_amount))
    else:
        # Optional: hide this line if you don't want to show exemption
        values.append(("MPF Deduction (Exempt)", 0))

    values.append(("Net Payment", net_payment))

    pdf.setFont("Helvetica", 11)
    y = box_top - 20
    for label, amount in values:
        if label == "Net Payment":
            # Draw line above Net Payment
            pdf.line(margin_left + 10, y + 15, margin_left + box_width - 10, y + 15)
            pdf.setFont("Helvetica-Bold", 11)  # Make Net Payment bold
            
        pdf.drawString(margin_left + 10, y, f"{label}:")
        if label == "MPF Deduction":
            pdf.drawRightString(margin_left + box_width - 10, y, f" - ${amount:,.2f}")
        else:
            pdf.drawRightString(margin_left + box_width - 10, y, f"${amount:,.2f}")
            
        if label == "Net Payment":
            pdf.setFont("Helvetica", 11)  # Reset to regular font after Net Payment
            
        y -= line_height + 2

    # Optional footer
    pdf.setFont("Helvetica-Oblique", 9)
    pdf.setFillColor(colors.grey)
    pdf.drawString(margin_left, 30, f"Period: {payroll_period}")