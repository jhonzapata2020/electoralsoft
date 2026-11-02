import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = 'Credenciales_Oficiales_Janier_Lloreda_Turbo2026.pdf'
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=36,
    rightMargin=36,
    topMargin=26,
    bottomMargin=26
)

styles = getSampleStyleSheet()

# Official Colors
primary_blue = colors.HexColor('#001E72')
somos_blue = colors.HexColor('#0080FF')
turbo_green = colors.HexColor('#3FBC24')
turbo_yellow = colors.HexColor('#F4BD21')
slate_dark = colors.HexColor('#1E293B')
slate_light = colors.HexColor('#F8FAFC')
border_gray = colors.HexColor('#CBD5E1')

table_header = ParagraphStyle(
    'TH',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=11,
    textColor=colors.white,
    alignment=1
)

table_cell = ParagraphStyle(
    'TC',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8,
    leading=11,
    textColor=slate_dark
)

table_cell_bold = ParagraphStyle(
    'TCB',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=11,
    textColor=primary_blue
)

story = []

# --- 1. BANNER TRICOLOR SUPERIOR (Bandera de Turbo) ---
flag_table = Table([['', '', '']], colWidths=[180, 180, 180], rowHeights=[6])
flag_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,0), turbo_yellow),
    ('BACKGROUND', (1,0), (1,0), turbo_green),
    ('BACKGROUND', (2,0), (2,0), somos_blue),
    ('PADDING', (0,0), (-1,-1), 0),
    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ('TOPPADDING', (0,0), (-1,-1), 0),
]))
story.append(flag_table)
story.append(Spacer(1, 8))

# --- 2. HEADER CON LOGOS ---
logo_janier_path = 'public/logo-janier.png'
logo_somos_path = 'public/logo-somos.png'

img_janier = Image(logo_janier_path, width=165, height=76)
img_somos = Image(logo_somos_path, width=115, height=62)

header_text = [
    Paragraph('<b>ALCALDÍA DISTRITAL DE TURBO 2026 - 2029</b>', ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=10, textColor=primary_blue, alignment=1)),
    Paragraph('PROYECTO POLÍTICO OFICIAL • SOMOS NUEVAS ACCIONES', ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=8, textColor=turbo_green, alignment=1)),
    Paragraph('<b>SISTEMA CENTRAL DE CONTROL TERRITORIAL Y ELECTORAL</b>', ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=11, textColor=primary_blue, alignment=1)),
    Paragraph('EMISIÓN OFICIAL DE CREDENCIALES • USO ESTRICTAMENTE CONFIDENCIAL', ParagraphStyle('H4', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#64748B'), alignment=1))
]

header_table = Table([[img_janier, header_text, img_somos]], colWidths=[160, 260, 120])
header_table.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('ALIGN', (0,0), (0,0), 'LEFT'),
    ('ALIGN', (1,0), (1,0), 'CENTER'),
    ('ALIGN', (2,0), (2,0), 'RIGHT'),
    ('PADDING', (0,0), (-1,-1), 2),
]))
story.append(header_table)
story.append(Spacer(1, 6))

story.append(HRFlowable(width='100%', thickness=1.5, color=primary_blue, spaceBefore=2, spaceAfter=6))

# --- 3. RECUADRO DE ACCESO OFICIAL ---
url_p = Paragraph('<b>ENLACE OFICIAL DE ACCESO:</b> https://electoralsoft.vercel.app  •  <b>PLATAFORMA:</b> Web Móvil y Escritorio', ParagraphStyle('UrlP', fontName='Helvetica-Bold', fontSize=8.5, textColor=primary_blue, alignment=1))
url_box = Table([[url_p]], colWidths=[540])
url_box.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF9C3')),
    ('BOX', (0,0), (-1,-1), 1, turbo_yellow),
    ('PADDING', (0,0), (-1,-1), 5),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
]))
story.append(url_box)
story.append(Spacer(1, 8))

# --- 4. TABLA MAESTRA DE CREDENCIALES ---
story.append(Paragraph('<b>1. TABLA OFICIAL DE CREDENCIALES MAESTRAS Y MANDOS</b>', ParagraphStyle('Sec1', fontName='Helvetica-Bold', fontSize=9.5, textColor=primary_blue)))
story.append(Spacer(1, 4))

creds_data = [
    [
        Paragraph('USUARIO / TITULAR', table_header),
        Paragraph('CÉDULA', table_header),
        Paragraph('CONTRASEÑA', table_header),
        Paragraph('ROL ASIGNADO', table_header),
        Paragraph('ÁMBITO DE PODER / TERRITORIO', table_header)
    ],
    [
        Paragraph('<b>JANIER LLOREDA VALENCIA</b><br/><font color="#64748B">Candidato a la Alcaldía</font>', table_cell_bold),
        Paragraph('<b>1001</b>', table_cell_bold),
        Paragraph('<b>1001</b>', table_cell_bold),
        Paragraph('<font color="#001E72"><b>Gerente General</b></font><br/>(Admin Supremo)', table_cell),
        Paragraph('<b>Control Total Turbo:</b> Sala de Mando, 40 Barrios, 11 Equipos, Zonas Rurales, Censo Completo.', table_cell)
    ],
    [
        Paragraph('<b>COORDINADOR GENERAL</b><br/><font color="#64748B">Coordinación Estratégica</font>', table_cell_bold),
        Paragraph('<b>1002</b>', table_cell),
        Paragraph('<b>1002</b>', table_cell),
        Paragraph('Coordinador General', table_cell),
        Paragraph('Supervisión operativa de las 11 Juntas de Equipos y seguimiento a metas de líderes.', table_cell)
    ],
    [
        Paragraph('<b>SECRETARIA GENERAL</b><br/><font color="#64748B">Administración Central</font>', table_cell_bold),
        Paragraph('<b>1003</b>', table_cell),
        Paragraph('<b>1003</b>', table_cell),
        Paragraph('<font color="#2F961A"><b>Secretaria General</b></font><br/>(Poder de Alta)', table_cell),
        Paragraph('<b>Creación de usuarios</b>, registro de secretarias de equipo, líderes de barrio y asignación de claves.', table_cell)
    ],
    [
        Paragraph('<b>SECRETARIA EQUIPO 1</b><br/><font color="#64748B">Comuna Urbana 1</font>', table_cell_bold),
        Paragraph('<b>1004</b>', table_cell),
        Paragraph('<b>1004</b>', table_cell),
        Paragraph('Secretaria de Equipo', table_cell),
        Paragraph('<b>Equipo Operativo 1:</b> Barrios Buenos Aires, Flores, Gaitán y Malvinas. Asignación directa a líderes.', table_cell)
    ],
    [
        Paragraph('<b>LÍDER DE EQUIPO 1</b><br/><font color="#64748B">Operador de Campo</font>', table_cell_bold),
        Paragraph('<b>1005</b>', table_cell),
        Paragraph('<b>1005</b>', table_cell),
        Paragraph('Líder de Territorio', table_cell),
        Paragraph('Registro directo en celular de votantes y simpatizantes fidelizados en territorio.', table_cell)
    ],
]

table_creds = Table(creds_data, colWidths=[130, 55, 65, 105, 185])
table_creds.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), primary_blue),
    ('GRID', (0,0), (-1,-1), 0.5, border_gray),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('PADDING', (0,0), (-1,-1), 4.5),
    ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F0FDF4')),
    ('ROWBACKGROUNDS', (0,2), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
]))
story.append(table_creds)
story.append(Spacer(1, 8))

# --- 5. CASO DE USO PASO A PASO ---
story.append(Paragraph('<b>2. PROTOCOLO OPERATIVO: CÓMO DAR DE ALTA Y DESPACHAR POR WHATSAPP</b>', ParagraphStyle('Sec2', fontName='Helvetica-Bold', fontSize=9.5, textColor=primary_blue)))
story.append(Spacer(1, 4))

steps_data = [
    [
        Paragraph('<b>PASO</b>', table_header),
        Paragraph('ACCIÓN A REALIZAR POR JANIER O LA SECRETARIA', table_header),
        Paragraph('RESULTADO EN LA PLATAFORMA', table_header)
    ],
    [
        Paragraph('<b>1</b>', table_cell_bold),
        Paragraph('<b>Ingreso Inicial:</b> Entrar al enlace <font color="#0080FF">https://electoralsoft.vercel.app</font> e iniciar sesión con cédula <b>1001</b> y contraseña <b>1001</b>.', table_cell),
        Paragraph('Acceso directo a la Sala de Mando con métricas de los 40 barrios y botón de alta.', table_cell)
    ],
    [
        Paragraph('<b>2</b>', table_cell_bold),
        Paragraph('<b>Alta Personal de Janier:</b> Tocar el botón <b>"Crear Usuario"</b>, ingresar su cédula real, teléfono, rol <b>"Gerente General"</b> y su clave elegida.', table_cell),
        Paragraph('Janier queda con su cédula propia como Administrador Supremo permanente.', table_cell)
    ],
    [
        Paragraph('<b>3</b>', table_cell_bold),
        Paragraph('<b>Crear a la Secretaria:</b> Tocar <b>"Crear Usuario"</b>, ingresar nombre de la secretaria, cédula, celular, rol <i>"Secretaria General"</i> y contraseña.', table_cell),
        Paragraph('El sistema la guarda en la base de datos de Supabase y genera la tarjeta de despacho.', table_cell)
    ],
    [
        Paragraph('<b>4</b>', table_cell_bold),
        Paragraph('<b>Despacho Directo por WhatsApp:</b> Tocar el botón verde <b>"Enviar Credenciales por WhatsApp"</b> que aparece tras crear a la secretaria.', table_cell),
        Paragraph('Se abre WhatsApp con el mensaje oficial listo para enviar y la tarjeta gráfica con el logo.', table_cell)
    ],
]

table_steps = Table(steps_data, colWidths=[40, 260, 240])
table_steps.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
    ('GRID', (0,0), (-1,-1), 0.5, border_gray),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('PADDING', (0,0), (-1,-1), 4),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
]))
story.append(table_steps)
story.append(Spacer(1, 8))

# --- 6. SEGURIDAD Y FIRMAS ---
notice_p = Paragraph('<b>CONFIDENCIALIDAD:</b> Las credenciales aquí emitidas otorgan acceso administrativo y de recolección de datos sensibles para la campaña electoral del Distrito de Turbo. Toda acción en la plataforma queda auditada con fecha, hora y cédula del operador.', ParagraphStyle('NotP', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#475569'), leading=9))
story.append(notice_p)
story.append(Spacer(1, 14))

# Firmas
sig_data = [
    [
        Paragraph('__________________________________________<br/><b>JANIER LLOREDA VALENCIA</b><br/>Candidato a la Alcaldía Distrital de Turbo<br/>SOMOS Nuevas Acciones', ParagraphStyle('Sig1', fontName='Helvetica', fontSize=7.5, alignment=1, textColor=primary_blue)),
        Paragraph('__________________________________________<br/><b>SECRETARÍA GENERAL DE CAMPAÑA</b><br/>Control Territorial y Censo Electoral<br/>Distrito Especial de Turbo', ParagraphStyle('Sig2', fontName='Helvetica', fontSize=7.5, alignment=1, textColor=primary_blue)),
    ]
]
table_sigs = Table(sig_data, colWidths=[270, 270])
table_sigs.setStyle(TableStyle([
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
]))
story.append(table_sigs)

doc.build(story)
print('PDF generated successfully:', pdf_path, 'Size:', os.path.getsize(pdf_path), 'bytes')
