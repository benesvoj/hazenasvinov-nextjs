export function formatMonth(monthKey: string) {
    const [month, year] = monthKey.split(' ');
    const monthNames: { [key: string]: string } = {
      'září': 'Září',
      'říjen': 'Říjen',
      'listopad': 'Listopad',
      'prosinec': 'Prosinec',
      'leden': 'Leden',
      'únor': 'Únor',
      'březen': 'Březen',
      'duben': 'Duben',
      'květen': 'Květen',
      'červen': 'Červen',
      'červenec': 'Červenec',
      'srpen': 'Srpen'
    };
    return `${monthNames[month] || month} ${year}`;
  }