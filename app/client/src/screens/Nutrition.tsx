import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Button, Field, Input, ProgressBar, Section } from '../components/ui';
import './nutrition.css';

interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
interface Day {
  calorieTarget: number;
  proteinTarget: number;
  consumed: number;
  remaining: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  foods: Food[];
}

export default function Nutrition() {
  const { t } = useLanguage();
  const [day, setDay] = useState<Day | null>(null);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  async function load() {
    const r = await api.get<{ day: Day }>('/nutrition/today');
    setDay(r.day);
  }

  useEffect(() => {
    load();
  }, []);

  async function addFood() {
    if (!name || !calories) return;
    await api.post('/nutrition/today/food', { name, calories: Number(calories), protein: Number(protein) || 0 });
    setName('');
    setCalories('');
    setProtein('');
    load();
  }

  async function addWater(ml: number) {
    await api.post('/nutrition/today/water', { deltaMl: ml });
    load();
  }

  async function removeFood(id: number) {
    await api.delete(`/nutrition/food/${id}`);
    load();
  }

  if (!day) return <Screen title={t('nutritionTitle')} nav={false}>{null}</Screen>;

  const pct = day.calorieTarget ? (day.consumed / day.calorieTarget) * 100 : 0;

  return (
    <Screen title={t('nutritionTitle')} nav={false}>
      <Section>
        <div className="nut-hero">
          <div>
            <span className="nut-hero-n">{day.calorieTarget}</span>
            <span className="nut-hero-l">{t('nutritionTarget')}</span>
          </div>
          <div>
            <span className="nut-hero-n">{day.consumed}</span>
            <span className="nut-hero-l">{t('nutritionConsumed')}</span>
          </div>
          <div>
            <span className="nut-hero-n" style={{ color: day.remaining < 0 ? 'var(--dg)' : 'var(--ok)' }}>
              {day.remaining}
            </span>
            <span className="nut-hero-l">{t('nutritionRemaining')}</span>
          </div>
        </div>
        <ProgressBar value={pct} tone={pct > 100 ? 'am' : 'ac'} />
      </Section>

      <Section title={t('nutritionMacros')}>
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-n">{day.protein}g</span>
            <span className="detail-stat-l">{t('nutritionProtein')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{day.carbs}g</span>
            <span className="detail-stat-l">{t('nutritionCarbs')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{day.fat}g</span>
            <span className="detail-stat-l">{t('nutritionFat')}</span>
          </div>
        </div>
      </Section>

      <Section title={t('nutritionWater', { l: (day.waterMl / 1000).toFixed(2) })}>
        <div className="type-row">
          <Button variant="secondary" onClick={() => addWater(250)}>
            +250ml
          </Button>
          <Button variant="secondary" onClick={() => addWater(500)}>
            +500ml
          </Button>
        </div>
      </Section>

      <Section title={t('nutritionLogFood')}>
        <div className="type-row">
          <Field label={t('nutritionItem')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chicken & rice" />
          </Field>
          <Field label={t('nutritionKcal')}>
            <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="550" />
          </Field>
          <Field label={t('nutritionProtein')}>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="40" />
          </Field>
        </div>
        <Button full variant="secondary" onClick={addFood} style={{ marginTop: 12 }}>
          {t('add')}
        </Button>
      </Section>

      <Section title={t('nutritionTodaysLog')}>
        {day.foods.length === 0 ? (
          <p className="today-empty">{t('nutritionNothingLogged')}</p>
        ) : (
          day.foods.map((f) => (
            <div key={f.id} className="nut-food-row">
              <div>
                <p className="tr-name">{f.name}</p>
                <p className="tr-meta">{f.calories} kcal · {f.protein}g {t('nutritionProtein').toLowerCase()}</p>
              </div>
              <button className="today-link" onClick={() => removeFood(f.id)}>
                {t('nutritionRemove')}
              </button>
            </div>
          ))
        )}
      </Section>
    </Screen>
  );
}
