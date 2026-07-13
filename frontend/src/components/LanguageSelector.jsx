import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage, languageNames, translate } = useLanguage();

  return (
    <div className="language-selector">
      <div className="language-dropdown-wrapper">
        <Globe size={18} />
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="language-dropdown"
          title={translate('common.language')}
        >
          {Object.entries(languageNames).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
