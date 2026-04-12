function generateOverviewList(rows, calendar) {
  let currentTotalDays = 0;
  const daysData = {};

  rows.forEach((r) => {
    if (r.pickup) return; // ignore pickup days? wait, dayHtml handles pickup? No, generateDayHtml includes all scenes?
    const shootDays = Number(r.shootDays) || 0;
    const startDay = Math.ceil(currentTotalDays + 0.001) || 1;
    currentTotalDays += shootDays;
    const endDay = Math.ceil(currentTotalDays);

    for (let d = startDay; d <= endDay; d++) {
      if (!daysData[d]) daysData[d] = { characters: new Set(), locations: new Set() };
      if (r.location && r.location !== '—') daysData[d].locations.add(r.location);
      if (r.characters) {
        r.characters.forEach(c => daysData[d].characters.add(c));
      }
    }
  });

  return daysData;
}
