'use strict';

const WHATSAPP_NUMBER = '212762666574';
const SUPPORTED_LANGS = ['fr', 'ar'];
let currentLang = 'fr';

/* ---------- Safe localStorage helpers (can throw in private mode) ---------- */
function readStoredLang() {
    try {
        const value = localStorage.getItem('dreamcenter_lang');
        return SUPPORTED_LANGS.includes(value) ? value : 'fr';
    } catch (e) {
        return 'fr';
    }
}

function storeLang(lang) {
    try {
        localStorage.setItem('dreamcenter_lang', lang);
    } catch (e) { /* ignore */ }
}

/* ---------- Language switch ---------- */
const OPTION_TEXTS = {
    fr: {
        '': 'Sélectionnez',
        languages: 'Cours de Langues',
        bac: 'Préparation BAC',
        coaching: 'Développement Personnel',
        other: 'Autre'
    },
    ar: {
        '': 'اختر',
        languages: 'دورات اللغات',
        bac: 'التحضير للباكالوريا',
        coaching: 'التطوير الشخصي',
        other: 'أخرى'
    }
};

function switchLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = 'fr';
    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const isArabic = lang === 'ar';
    document.body.classList.toggle('rtl', isArabic);
    document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-fr]').forEach(element => {
        const text = isArabic ? element.getAttribute('data-ar') : element.getAttribute('data-fr');
        if (text) element.textContent = text;   // textContent, never innerHTML
    });

    const select = document.getElementById('interest');
    if (select) {
        select.querySelectorAll('option').forEach(option => {
            const label = OPTION_TEXTS[lang][option.value];
            if (label) option.textContent = label;
        });
    }

    storeLang(lang);
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
});

/* ---------- Mobile menu ---------- */
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => navMenu.classList.toggle('active'));
}

/* ---------- Smooth scrolling ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navMenu) navMenu.classList.remove('active');
    });
});

/* ---------- Fade-in animations ---------- */
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ---------- Contact form -> WhatsApp ---------- */
const MESSAGES = {
    fr: {
        invalidName: 'Veuillez entrer un nom valide (2 à 80 caractères).',
        invalidPhone: 'Veuillez entrer un numéro de téléphone valide (8 à 15 chiffres).',
        invalidInterest: 'Veuillez choisir un programme.',
        tooLong: 'Votre message est trop long (500 caractères maximum).',
        success: 'Merci ! Vous allez être redirigé vers WhatsApp.',
        hello: 'Bonjour Dream Center!',
        title: '*Nouvelle demande:*',
        name: 'Nom', phone: 'Téléphone', program: 'Programme', message: 'Message',
        bye: 'Merci!'
    },
    ar: {
        invalidName: 'يرجى إدخال اسم صحيح (من 2 إلى 80 حرفاً).',
        invalidPhone: 'يرجى إدخال رقم هاتف صحيح (من 8 إلى 15 رقماً).',
        invalidInterest: 'يرجى اختيار برنامج.',
        tooLong: 'رسالتك طويلة جداً (500 حرف كحد أقصى).',
        success: 'شكراً! ستتم إعادة توجيهك إلى واتساب.',
        hello: 'مرحباً مركز الأحلام!',
        title: '*طلب جديد:*',
        name: 'الاسم', phone: 'الهاتف', program: 'البرنامج', message: 'رسالة',
        bye: 'شكراً!'
    }
};

const ALLOWED_INTERESTS = ['languages', 'bac', 'coaching', 'other'];

// Remove control characters and collapse whitespace
function clean(text) {
    return String(text).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const t = MESSAGES[currentLang];

        // Honeypot: real visitors never see or fill this field
        if (document.getElementById('website').value !== '') return;

        const name = clean(document.getElementById('name').value);
        const phoneRaw = document.getElementById('phone').value;
        const phone = phoneRaw.replace(/[^\d+]/g, '');
        const phoneDigits = phone.replace(/\D/g, '');
        const interest = document.getElementById('interest').value;
        const message = document.getElementById('message').value.trim();

        if (name.length < 2 || name.length > 80) return alert(t.invalidName);
        if (!/^\+?\d+$/.test(phone) || phoneDigits.length < 8 || phoneDigits.length > 15) return alert(t.invalidPhone);
        if (!ALLOWED_INTERESTS.includes(interest)) return alert(t.invalidInterest);
        if (message.length > 500) return alert(t.tooLong);

        const interestLabel = OPTION_TEXTS[currentLang][interest];

        const lines = [
            t.hello,
            '',
            t.title,
            `👤 *${t.name}:* ${name}`,
            `📱 *${t.phone}:* ${phone}`,
            `🎯 *${t.program}:* ${interestLabel}`
        ];
        if (message) lines.push(`💬 *${t.message}:* ${clean(message)}`);
        lines.push('', t.bye);

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;

        window.open(url, '_blank', 'noopener,noreferrer');
        this.reset();
        alert(t.success);
    });
}

/* ---------- Load saved language ---------- */
document.addEventListener('DOMContentLoaded', () => switchLanguage(readStoredLang()));
