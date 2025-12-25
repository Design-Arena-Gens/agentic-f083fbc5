import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { traitNames, traitDescriptions } from '../data/questions';

type TestResults = {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
};

type Props = {
  results: TestResults;
  onRestart: () => void;
};

type StoredResult = {
  timestamp: string;
  results: TestResults;
};

export default function ResultsView({ results, onRestart }: Props) {
  const [allResults, setAllResults] = useState<StoredResult[]>([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Charger les résultats existants
    const stored = localStorage.getItem('bigFiveResults');
    const existingResults: StoredResult[] = stored ? JSON.parse(stored) : [];

    // Ajouter le nouveau résultat
    const newResult: StoredResult = {
      timestamp: new Date().toISOString(),
      results: results
    };

    const updatedResults = [...existingResults, newResult];
    setAllResults(updatedResults);

    // Sauvegarder
    localStorage.setItem('bigFiveResults', JSON.stringify(updatedResults));
  }, [results]);

  const radarData = [
    { trait: 'Ouverture', value: results.O, fullMark: 100 },
    { trait: 'Conscience', value: results.C, fullMark: 100 },
    { trait: 'Extraversion', value: results.E, fullMark: 100 },
    { trait: 'Agréabilité', value: results.A, fullMark: 100 },
    { trait: 'Névrosisme', value: results.N, fullMark: 100 },
  ];

  const calculateAverages = () => {
    if (allResults.length === 0) return null;

    const totals = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    allResults.forEach(result => {
      totals.O += result.results.O;
      totals.C += result.results.C;
      totals.E += result.results.E;
      totals.A += result.results.A;
      totals.N += result.results.N;
    });

    const count = allResults.length;
    return {
      O: Math.round(totals.O / count),
      C: Math.round(totals.C / count),
      E: Math.round(totals.E / count),
      A: Math.round(totals.A / count),
      N: Math.round(totals.N / count),
    };
  };

  const comparisonData = () => {
    const averages = calculateAverages();
    if (!averages) return [];

    return [
      { trait: 'Ouverture', current: results.O, moyenne: averages.O },
      { trait: 'Conscience', current: results.C, moyenne: averages.C },
      { trait: 'Extraversion', current: results.E, moyenne: averages.E },
      { trait: 'Agréabilité', current: results.A, moyenne: averages.A },
      { trait: 'Névrosisme', current: results.N, moyenne: averages.N },
    ];
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(allResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `bigfive_results_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToCSV = () => {
    let csv = 'Timestamp,Ouverture,Conscience,Extraversion,Agréabilité,Névrosisme\n';
    allResults.forEach(result => {
      const date = new Date(result.timestamp).toLocaleString('fr-FR');
      csv += `${date},${result.results.O},${result.results.C},${result.results.E},${result.results.A},${result.results.N}\n`;
    });

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const exportFileDefaultName = `bigfive_results_${new Date().toISOString().split('T')[0]}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          // Fusionner avec les résultats existants
          const merged = [...allResults, ...imported];
          // Supprimer les doublons basés sur le timestamp
          const unique = merged.filter((item, index, self) =>
            index === self.findIndex(t => t.timestamp === item.timestamp)
          );
          setAllResults(unique);
          localStorage.setItem('bigFiveResults', JSON.stringify(unique));
          alert(`${imported.length} résultats importés avec succès!`);
        }
      } catch (error) {
        alert('Erreur lors de l\'importation du fichier');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données?')) {
      localStorage.removeItem('bigFiveResults');
      setAllResults([{ timestamp: new Date().toISOString(), results }]);
      alert('Données supprimées!');
    }
  };

  const getInterpretation = (trait: string, score: number) => {
    if (score >= 70) return 'Très élevé';
    if (score >= 55) return 'Élevé';
    if (score >= 45) return 'Moyen';
    if (score >= 30) return 'Bas';
    return 'Très bas';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Vos Résultats Big Five</h1>
        <p>Profil de personnalité complet</p>
      </div>

      <div className="results-container">
        {Object.entries(results).map(([trait, score]) => (
          <div key={trait} className="trait-card">
            <div className="trait-header">
              <div className="trait-name">
                {traitNames[trait as keyof typeof traitNames]}
              </div>
              <div className="trait-score">{score}%</div>
            </div>
            <div className="trait-description">
              {traitDescriptions[trait as keyof typeof traitDescriptions]}
            </div>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#667eea' }}>
              Niveau: {getInterpretation(trait, score)}
            </div>
            <div className="trait-bar">
              <div className="trait-bar-fill" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
          Graphique Radar de Personnalité
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="trait" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Score" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {allResults.length > 1 && (
        <>
          <button
            className="nav-button primary"
            onClick={() => setShowStats(!showStats)}
            style={{ margin: '20px auto', display: 'block' }}
          >
            {showStats ? 'Masquer' : 'Afficher'} les Tendances
          </button>

          {showStats && (
            <div className="chart-container">
              <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
                Comparaison avec la Moyenne
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trait" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#667eea" name="Score Actuel" />
                  <Bar dataKey="moyenne" fill="#82ca9d" name="Moyenne" />
                </BarChart>
              </ResponsiveContainer>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{allResults.length}</div>
                  <div className="stat-label">Tests Complétés</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {new Date(allResults[0].timestamp).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="stat-label">Premier Test</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {new Date(allResults[allResults.length - 1].timestamp).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="stat-label">Dernier Test</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="export-section">
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Exporter les Données</h3>
        <button className="export-button" onClick={exportToJSON}>
          Exporter en JSON
        </button>
        <button className="export-button" onClick={exportToCSV}>
          Exporter en CSV
        </button>
      </div>

      <div className="admin-section">
        <h3>Gestion des Données</h3>
        <p style={{ marginBottom: '15px', color: '#856404' }}>
          Importez des résultats précédents ou gérez vos données
        </p>
        <input
          type="file"
          id="file-input"
          className="file-input"
          accept=".json"
          onChange={importFromFile}
        />
        <label htmlFor="file-input" className="file-label">
          Importer JSON
        </label>
        <button
          className="export-button"
          onClick={clearAllData}
          style={{ background: '#dc3545', marginLeft: '10px' }}
        >
          Supprimer Données
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className="restart-button" onClick={onRestart}>
          Refaire le Test
        </button>
      </div>
    </div>
  );
}
