from fastapi import APIRouter, Request, Body, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from app.models.report_doc import Report
from app.services.report_service import save_report, get_report, list_reports, delete_report
from weasyprint import HTML
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="", tags=["Reports"])
templates = Jinja2Templates(directory="app/templates")

NOT_FOUND = "Report not found"

@router.post("/", response_class=JSONResponse)
async def create_report(request: Request, report: Report = Body(...)):
    db = request.app.state.db
    try:
        rid = await save_report(db, report)
        return JSONResponse(status_code=201, content={"id": rid})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_class=JSONResponse)
async def get_reports(
    request: Request,
    limit: int = 50,
    skip: int = 0,
    score: str = None,
    pipeline_type: str = None,
    repo: str = None
):
    db = request.app.state.db
    reports = await list_reports(db, limit, skip, score, pipeline_type, repo)
    return JSONResponse(content={"count": len(reports), "results": reports})


@router.get("/{report_id}", response_class=JSONResponse)
async def get_report_endpoint(request: Request, report_id: str):
    db = request.app.state.db
    doc = await get_report(db, report_id)
    if not doc:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return JSONResponse(content=doc)

@router.get("/{report_id}/html", response_class=HTMLResponse)
async def report_html(request: Request, report_id: str):
    db = request.app.state.db
    doc = await get_report(db, report_id)
    if not doc:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return templates.TemplateResponse("report.html", {"request": request, "report": doc})

@router.delete("/{report_id}")
async def delete_report_endpoint(request: Request, report_id: str):
    db = request.app.state.db
    ok = await delete_report(db, report_id)
    if not ok:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return JSONResponse(content={"deleted": report_id})


@router.get("/{report_id}/pdf")
async def report_pdf(request: Request, report_id: str):
    db = request.app.state.db
    doc = await get_report(db, report_id)
    if not doc:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    # Render HTML using Jinja template (reuse report.html)
    from app.routes.report_routes import templates
    html_content = templates.get_template("report.html").render(report=doc, request=request)
    pdf_io = io.BytesIO()
    HTML(string=html_content, base_url=request.url_for("root")).write_pdf(pdf_io)
    pdf_io.seek(0)
    return StreamingResponse(pdf_io, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"})