      // Filter posts by category using tag-based matching
      // TODO: remove this map, it should be working based on categoryId

export const categoryTagMap: { [key: string]: string[] } = {
    'men': ['muži', 'mužský', 'dospělí', 'muž', 'mužů', 'mužská', 'mužské', 'mužský tým', 'mužský oddíl', 'dospělí', 'senior', 'senioři'],
    'women': ['ženy', 'ženský', 'dospělé', 'žena', 'ženská', 'ženské', 'ženský tým', 'ženský oddíl', 'dospělé', 'seniorky', 'seniorky'],
    'youngerBoys': ['mladší žáci', 'mladší', 'žáci', 'mladší žák', 'dorostenci', 'dorostenec', 'dorostenci'],
    'youngerGirls': ['mladší žačky', 'mladší', 'žačky', 'mladší žačka', 'dorostenky', 'dorostenka'],
    'olderBoys': ['starší žáci', 'starší', 'žáci', 'starší žák', 'junioři', 'junior'],
    'olderGirls': ['starší žačky', 'starší', 'žačky', 'starší žačka', 'juniorky', 'juniorka'],
    'prepKids': ['přípravka', 'přípravky', 'děti', 'dítě', 'přípravka']
  };