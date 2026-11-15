// Bölüm tamamlanma kartlarında gösterilen ayet metinlerini ve kaynak bilgilerini içerir.
// Diyanet meallerinden kısa alıntılar. Üç nokta, ayetin yalnızca bir bölümünün alındığını gösterir.
// Metinler oyun puanıyla ilişkilendirilmez; bölüm sonunda okuyabilmek için süre sınırı yoktur.
const worldZeroVerses = [
    { text: 'İnsanlara güzel söz söyleyin…', reference: 'Bakara 2/83 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/mushaf/kuran-meal-1/bakara-suresi-2/ayet-82/kuran-yolu-meali-5' },
    { text: 'Müminler ancak kardeştirler…', reference: 'Hucurât 49/10 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/tefsir/Hucurat-suresi/4622/10-ayet-tefsiri' },
    { text: 'Yiyin için fakat israf etmeyin.', reference: 'A’râf 7/31 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/mushaf/kuran-meal-1/araf-suresi-7/ayet-31/diyanet-isleri-baskanligi-meali-1' },
    { text: 'Rabbim! İlmimi arttır', reference: 'Tâhâ 20/114 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/tefsir/T%C3%A2h%C3%A2-suresi/2461/113-114-ayet-tefsiri' },
    { text: 'İyilik ve takvâ hususunda yardımlaşın…', reference: 'Mâide 5/2 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/tefsir/M%C3%83%C2%A2ide-suresi/671/2-ayet-tefsiri' },
    { text: 'Allah işini güzel yapanları sever.', reference: 'Âl-i İmrân 3/134 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/tefsir/sure/3/ayet/133?kaynak=1' },
    { text: 'Demek ki zorlukla beraber bir kolaylık vardır.', reference: 'İnşirâh 94/5 · Ayet meali', source: 'https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/insirah-suresi-94/ayet-1/kuran-yolu-meali-5' },
    { text: 'Andolsun, eğer şükrederseniz elbette size nimetimi artırırım…', reference: 'İbrâhîm 14/7 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/ibrahim-suresi-14/ayet-6/diyanet-isleri-baskanligi-meali-1' },
    { text: 'Muhakkak ki Allah, adaleti, iyiliği, akrabaya yardım etmeyi emreder…', reference: 'Nahl 16/90 · Mealden alıntı', source: 'https://kuran.diyanet.gov.tr/kuran?ayet=89&mode=kuran-meal&sure=16' },
    { text: 'Rabbinin nimetine gelince; işte onu anlat.', reference: 'Duhâ 93/11 · Ayet meali', source: 'https://kuran.diyanet.gov.tr/mushaf/meal-2/duha-suresi-93/ayet-11/diyanet-isleri-baskanligi-meali-1' },
    { text: 'O halde önemli bir işi bitirince hemen diğerine koyul.', reference: 'İnşirâh 94/7 · Ayet meali', source: 'https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/insirah-suresi-94/ayet-1/kuran-yolu-meali-5' }
];

// Yeni dünyada da doğrulanmış mevcut kısa alıntılar kullanılır.
export const verses = [...worldZeroVerses, worldZeroVerses[6], worldZeroVerses[5], worldZeroVerses[10], worldZeroVerses[8]];
