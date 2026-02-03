import { useTranslation } from '@rimori/react-client';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('wiki.settings.title')}</h1>
    </div>
  );
}
