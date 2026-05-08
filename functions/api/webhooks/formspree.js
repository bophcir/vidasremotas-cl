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

function lower(value) {
  return String(value || '').toLowerCase();
}

function isBusinessLead(values) {
  const haystack = [values.name, values.email, values.phone, values.message, values.subject, values.form]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return BUSINESS_KEYWORDS.some((keyword) => haystack.includes(keyword));
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

function textFrom(obj) {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function pick(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function normalizePayload(raw) {
  const base = raw?.data || raw?.fields || raw?.submission || raw || {};
  const maybeFields = base?.fields || base;

  return {
    name: pick(maybeFields, ['nombre', 'name', 'full_name', 'fullname']) || pick(base, ['name', 'nombre']),
    email: pick(maybeFields, ['email', 'correo']) || pick(base, ['email']),
    phone: pick(maybeFields, ['telefono', 'phone', 'tel']) || pick(base, ['phone']),
    message: pick(maybeFields, ['mensaje', 'message', 'comments', 'body']) || pick(base, ['message']),
    subject: pick(base, ['subject', 'title']) || pick(maybeFields, ['subject']),
    form: pick(base, ['form_name', 'form', 'formTitle']) || pick(maybeFields, ['form']),
    raw,
  };
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

async function storeLog(env, entry) {
  const line = JSON.stringify(entry);
  console.log(line);

  if (env.CONTACT_LOG) {
    const key = `${entry.timestamp}-${crypto.randomUUID()}`;
    await env.CONTACT_LOG.put(key, line);
  }
}

function makeReplyText(values) {
  const name = values.name || 'Hola';
  return `Hola ${name},\n\nGracias por escribir a Vidas Remotas. Hemos recibido tu mensaje y lo revisaremos con atención.\n\nEn general, orientamos cada caso según ubicación, nivel de autonomía esperado y alcance técnico. Si es necesario, un especialista asignado se contactará a la brevedad para avanzar contigo.\n\nSaludos cordiales,\nEquipo Vidas Remotas`;
}

function makeInternalText(values, businessLead) {
  return [
    businessLead ? 'Nuevo contacto con potencial comercial' : 'Nuevo contacto recibido',
    '',
    textFrom({
      nombre: values.name,
      email: values.email,
      telefono: values.phone,
      asunto: values.subject,
      formulario: values.form,
      mensaje: values.message,
    }),
  ].join('\n');
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function redirectResponse(url) {
  return Response.redirect(url, 303);
}

export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    const expectedSecret = env.FORMSPREE_WEBHOOK_SECRET;
    const secret = url.searchParams.get('secret');

    if (expectedSecret && secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const contentType = request.headers.get('content-type') || '';
    let raw;

    if (contentType.includes('application/json')) {
      raw = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      raw = Object.fromEntries(formData.entries());
    } else {
      raw = { body: await request.text() };
    }

    const values = normalizePayload(raw);
    const entry = {
      timestamp: new Date().toISOString(),
      source: 'formspree-webhook',
      isBusinessLead: isBusinessLead(values),
      ...values,
    };

    await storeLog(env, entry);

    const businessLead = entry.isBusinessLead;
    const replyText = makeReplyText(values);
    const internalText = makeInternalText(values, businessLead);

    let replyFailed = false;
    try {
      if (values.email) {
        await sendEmail(env, {
          from: env.MAIL_FROM || 'Vidas Remotas <onboarding@resend.dev>',
          to: [values.email],
          subject: 'Hemos recibido tu mensaje — Vidas Remotas',
          text: replyText,
          html: toHtml(replyText),
          reply_to: env.REPLY_TO || 'bophcir@gmail.com',
        });
      }
    } catch (error) {
      replyFailed = true;
      console.warn('Reply email failed:', String(error));
    }

    if (businessLead || replyFailed) {
      try {
        await sendEmail(env, {
          from: env.MAIL_FROM || 'Vidas Remotas <onboarding@resend.dev>',
          to: [env.INTERNAL_COPY_TO || 'Richard.poblete@gmail.com'],
          subject: `${businessLead ? 'Posible negocio' : 'Contacto recibido'} — ${values.name || 'sin nombre'} / Vidas Remotas`,
          text: `${replyFailed ? 'Aviso: la respuesta automática externa no se pudo enviar.\n\n' : ''}${internalText}`,
          html: toHtml(`${replyFailed ? 'Aviso: la respuesta automática externa no se pudo enviar.\n\n' : ''}${internalText}`),
          reply_to: values.email || env.REPLY_TO || 'bophcir@gmail.com',
        });
      } catch (error) {
        console.warn('Internal copy email failed:', String(error));
      }
    }

    return redirectResponse(new URL('/thanks', request.url).toString());
  } catch (error) {
    console.error('Webhook error:', String(error));
    return jsonResponse({ ok: false, error: 'No se pudo procesar el webhook.' }, 500);
  }
}
