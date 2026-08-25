import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getLegalDocument } from '../legal/documents';
import { Screen } from '../components/Shell';
import './legal.css';

export function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const doc = getLegalDocument(kind, lang);

  return (
    <Screen title={doc.title} kicker={`${t('legalUpdated')} ${doc.updated}`} nav={false}>
      <button className="auth-back" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← {t('back')}
      </button>

      <p className="legal-intro">{doc.intro}</p>

      {doc.sections.map((section) => (
        <section className="legal-section" key={section.heading}>
          <h2 className="legal-heading">{section.heading}</h2>
          {section.body.map((para, i) => (
            <p className="legal-para" key={i}>
              {para}
            </p>
          ))}
        </section>
      ))}

      <p className="legal-version">
        {t('legalVersion')} {doc.version}
      </p>
    </Screen>
  );
}

export function Terms() {
  return <LegalPage kind="terms" />;
}

export function Privacy() {
  return <LegalPage kind="privacy" />;
}
