const RESEND_API_URL = 'https://api.resend.com/emails';
const BUSINESS_KEYWORDS = [
  'negocio',
  'cotiz',
  'presupuesto',
  'propuesta',
  'empresa',
  'cliente',
  'invert',
  'alianza',
  'comercial',
  'proyecto',
  'compra',
  'adquis',
  'consultor',
  'desarrollo',
  'terreno',
  'cabana',
  'cabaña',
  'build',
];

function isBusinessLead(values) {
  const haystack = [values.mensaje, values.nombre, values.email, values.telefono, values.empresa]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return BUSINESS_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function toText(values) {
  return [
    `Nombre: ${values.nombre}`,
    `Email: ${values.email}`,
    values.telefono ? `Teléfono: ${values.telefono}` : null,
    values.empresa ? `Empresa: ${values.empresa}` : null,
    '',
    values.mensaje,
  ]
    .filter(Boolean)
    .join('\n');
}

function escapeHtml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toHtml(text) {
  return `<div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;white-space:normal;">${escapeHtml(text).replaceAll('\n', '<br />')}</div>`;
}

async function sendEmail(env, payload) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error ${response.status}: ${errorText}`);
  }

  return response.json();
}

function successResponse() {
  return new Response(JSON.stringify({ ok: true, next: '/thanks.html' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const values = {
      nombre: String(formData.get('nombre') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      telefono: String(formData.get('telefono') || '').trim(),
      mensaje: String(formData.get('mensaje') || '').trim(),
      empresa: String(formData.get('empresa') || '').trim(),
    };

    if (values.empresa) {
      return successResponse();
    }

    if (!values.nombre || !values.email || !values.mensaje) {
      return errorResponse('Faltan campos obligatorios.', 422);
    }

    const businessLead = isBusinessLead(values);
    const replyText = `Hola ${values.nombre},\n\nGracias por escribir a Vidas Remotas. Hemos recibido tu mensaje y lo revisaremos con atención.\n\nEn general, orientamos cada caso según ubicación, nivel de autonomía esperado y alcance técnico. Si es necesario, un especialista asignado se contactará a la brevedad para avanzar contigo.\n\nSaludos cordiales,\nEquipo Vidas Remotas`;

    await sendEmail(env, {
      from: env.MAIL_FROM || 'Vidas Remotas <onboarding@resend.dev>',
      to: [values.email],
      subject: 'Hemos recibido tu mensaje — Vidas Remotas',
      text: replyText,
      html: toHtml(replyText),
      reply_to: env.REPLY_TO || 'bophcir@gmail.com',
    });

    if (businessLead) {
      const internalText = `Nuevo contacto con potencial comercial\n\n${toText(values)}`;

      await sendEmail(env, {
        from: env.MAIL_FROM || 'Vidas Remotas <onboarding@resend.dev>',
        to: [env.INTERNAL_COPY_TO || 'Richard.poblete@gmail.com'],
        subject: `Posible negocio — ${values.nombre} / Vidas Remotas`,
        text: internalText,
        html: toHtml(internalText),
        reply_to: values.email,
      });
    }

    return successResponse();
  } catch (error) {
    return errorResponse('No se pudo procesar el formulario.', 500);
  }
}
