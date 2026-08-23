/* ================================================================
   PAST-PAPER ARCHIVE
   Built from PAPER_ARCHIVE (see archive.js): verified metadata and
   official PDF links for IOAA and IPhO. Statements and figures are not
   reproduced — each entry opens the official paper.
================================================================ */
const ARCHIVE = PAPER_ARCHIVE.map(p => Object.assign({}, p, {
  id: p.subject + '-' + p.year + '-' + p.type.charAt(0) + p.number,
  label: (p.subject === 'ioaa' ? 'IOAA' : 'IPhO') + ' ' + p.year
}));

const TOPIC_LABEL = {
  'coordinates':'Coordinates', 'time':'Time', 'celestial-mechanics':'Celestial mechanics',
  'photometry':'Photometry', 'stellar':'Stellar', 'binary':'Binary stars',
  'galactic':'Galactic', 'cosmology':'Cosmology', 'instrumentation':'Instrumentation',
  'data-analysis':'Data analysis', 'solar-system':'Solar system',
  'mechanics':'Mechanics', 'electromagnetism':'Electromagnetism',
  'thermodynamics':'Thermodynamics', 'waves':'Waves', 'optics':'Optics',
  'modern':'Modern physics', 'relativity':'Relativity', 'astro':'Astrophysics',
  'experimental':'Experimental'
};

/* Topic-aware opening nudges, since we don't hold the problem text. */
const TOPIC_HINTS = {
  'celestial-mechanics':['Start from conservation of energy and angular momentum.','Vis-viva relates speed to radius and semi-major axis: v² = GM(2/r − 1/a).'],
  'photometry':['Almost every photometry problem starts at m − M = 5log(d/10pc).','Every 5 magnitudes is exactly a factor of 100 in flux.'],
  'stellar':['L ∝ R²T⁴ — scale against the Sun rather than plugging in constants.','Hydrostatic equilibrium usually gives the pressure scale you need.'],
  'binary':['Write the mass function first, then see which quantities the data actually fixes.','For eclipses, the depth and duration carry the radii; the RV curve carries the masses.'],
  'cosmology':['At small z, v ≈ zc. Check whether the problem is small-z before assuming it.','Friedmann follows from Newtonian gravity on a uniform sphere.'],
  'galactic':['Flat rotation curves mean v² = GM(<r)/r with M growing linearly in r.','Compare enclosed mass to luminous mass — that difference is the point.'],
  'coordinates':['Draw the spherical triangle before writing a single equation.','The cosine rule for sides handles most Alt-Az ↔ RA/Dec conversions.'],
  'time':['Fix your reference: solar or sidereal? Most errors here are one of those two.','LST = RA of the meridian. Derive from there.'],
  'instrumentation':['Plate scale, f-ratio and resolving power — decide which one the question actually needs.','Rayleigh: θ ≈ 1.22λ/D, in radians.'],
  'solar-system':['Scale height and escape speed settle most atmosphere questions.','Check whether tidal or rotational effects dominate before expanding.'],
  'data-analysis':['Plot it log-log first — a power law becomes a straight line.','Propagate errors from partial derivatives, not by guessing.'],
  'mechanics':['Choose the system and draw the free-body diagram before any algebra.','Ask whether energy, momentum or angular momentum is conserved here.'],
  'electromagnetism':['Symmetry first: does Gauss or Ampère collapse this?','For induction, let Lenz set the sign before you compute magnitudes.'],
  'thermodynamics':['Name the process — isothermal, adiabatic, isobaric — then the first law is easy.','Entropy is the log of the number of microstates. Anchor there.'],
  'waves':['Write the boundary conditions first; the modes fall out of them.','Path difference over wavelength gives you the interference condition.'],
  'optics':['Pick a sign convention and hold it for the whole problem.','Fermat: the path is the one that makes the travel time stationary.'],
  'modern':['Check whether ħω or kT dominates before approximating.','For tunnelling, the exponent carries the physics; the prefactor rarely matters.'],
  'relativity':['The invariant interval is the real content; everything else is algebra.','Use four-momentum conservation and square it.'],
  'astro':['Order-of-magnitude first — it tells you which terms you can drop.','Dimensional analysis will usually get you within a factor of a few.'],
  'experimental':['Decide what you are measuring and what dominates the uncertainty.','Design so the quantity you want is a gradient, not a single reading.']
};

/* ================================================================
   QUESTION BANK & AUTO-GENERATOR
================================================================ */
const BANK = {
  ioaa: {
    easy: [
      { id:'ia-e1', topic:'Magnitudes', q:'Star A has apparent magnitude 1.0; star B has apparent magnitude 6.0.', parts:['How many times brighter is A than B?','Star C appears 100× brighter than B. What is the magnitude of C?'], hints:['Every 5 magnitudes is exactly a factor of 100 in flux.','Brighter means a smaller — even negative — magnitude number.'], sol:'A is 100× brighter than B. C = 6 − 5 = 1.0.' },
      { id:'ia-e2', topic:'Small-angle', q:'The Moon lies about 384,400 km away and subtends an angle of 0.52°.', parts:['Estimate the physical diameter of the Moon.'], hints:['Small-angle formula: size ≈ distance × angle (in radians).','0.52° ≈ 0.0091 rad.'], sol:'D ≈ 384,400 × 0.0091 ≈ 3,500 km (true value 3,475 km).' },
      { id:'ia-e3', topic:'Kepler III', q:'A planet orbits a Sun-like star (1 M☉) at a distance of 4 AU.', parts:['What is its orbital period?','If the star were 4 M☉ instead, what would the period become?'], hints:['P² = a³ / M when P is in years, a in AU, M in solar masses.'], sol:'P = 8 yr. With 4 M☉: P² = 64/4 → P = 4 yr.' },
      { id:'ia-e4', topic:'Time & longitude', q:'Two cities differ in longitude by 30°. It is local solar noon at the eastern city.', parts:['What is the local solar time at the western city?'], hints:['Earth rotates 15° per hour. West lags behind east.'], sol:'10:00 — two hours earlier.' }
    ],
    medium: [
      { id:'ia-m1', topic:'Visual binary', q:'A visual binary has orbital period 16 yr, angular semi-major axis 1.6″, and parallax 0.10″.', parts:['How far away is the system?','What is the physical semi-major axis in AU?','Find the total mass of the system.'], hints:['d (pc) = 1 / π (arcsec).','Convert angular to linear separation before touching Kepler.','M = a³ / P² with a in AU, P in years, M in M☉.'], sol:'d = 10 pc; a = 16 AU; M = 16³/16² = 16 M☉ — two hefty stars.' },
      { id:'ia-m2', topic:'Stellar physics', q:'A star’s blackbody spectrum peaks at 290 nm and its luminosity is 100 L☉.', parts:['Find its surface temperature.','Find its radius in solar radii (T☉ ≈ 5,800 K).'], hints:['Wien: λmax · T = 2.898×10⁻³ m·K.','L ∝ R²T⁴ — scale everything against the Sun.'], sol:'T ≈ 10,000 K. R = √100 × (5800/10000)² ≈ 3.4 R☉.' },
      { id:'ia-m3', topic:'Distance scale', q:'A star has apparent magnitude m = 8.5 and absolute magnitude M = 3.5.', parts:['Find its distance.','If dust adds 1 mag of uncorrected extinction, what distance would you wrongly infer?'], hints:['m − M = 5 log₁₀(d/10 pc).','Extinction makes stars look dimmer — hence farther.'], sol:'d = 100 pc. With 1 mag ignored: m−M = 6 → d ≈ 158 pc.' },
      { id:'ia-m4', topic:'Radio astronomy', q:'You want an angular resolution of 1° at the 21-cm hydrogen line.', parts:['What dish diameter do you need?','Why are radio dishes so much larger than optical telescopes?'], hints:['θ ≈ 1.22 λ / D, with θ in radians.','Resolution scales as λ/D — radio wavelengths are enormous.'], sol:'D ≈ 1.22 × 0.21 / 0.01745 ≈ 15 m.' }
    ],
    hard: [
      { id:'ia-h1', topic:'Galactic dynamics', q:'The Sun orbits the Galactic centre at v = 220 km/s at R₀ = 8 kpc.', parts:['Find the mass enclosed within R₀. (G = 4.30×10⁻³ pc (km/s)² / M☉)','If visible matter inside R₀ is ≈ 6×10¹⁰ M☉, what fraction of the mass is dark?'], hints:['Circular orbit: v² = GM/R — solve for M.'], sol:'M ≈ 9×10¹⁰ M☉; dark fraction ≈ (9−6)/9 ≈ 33%.' },
      { id:'ia-h2', topic:'Cosmology', q:'A galaxy is observed at redshift z = 0.015. Take H₀ = 70 km/s/Mpc.', parts:['Recession velocity?','Distance?','Lookback time?'], hints:['Small z: v ≈ z·c.','Lookback time ≈ d / c.'], sol:'v = 4,500 km/s; d ≈ 64 Mpc; light left ≈ 210 million years ago.' },
      { id:'ia-h3', topic:'Transits', q:'A Sun-like star shows transits of depth 1% repeating every 3.5 days.', parts:['Planet radius in R☉?','Semi-major axis?','Rough transit duration?'], hints:['Depth = (Rp / R★)².','Kepler III gives a from P (M = 1 M☉).','Duration ≈ P · R★ / (π a) for a central transit.'], sol:'Rp = 0.1 R☉ ≈ 1 R_Jupiter; a ≈ 0.045 AU; duration ≈ 2.8 h.' }
    ],
    olympiad: [
      { id:'ia-o1', topic:'Exoplanet characterisation', q:'A survey detects transits of a 1 M☉, 1 R☉, 5,800 K star. Period P = 4.0 days, transit depth 1%, edge-on orbit. Follow-up radial velocities show semi-amplitude K = 140 m/s.', parts:['Determine the planet’s radius.','Estimate the planet’s mass. (K ≈ 28.4 m/s · (Mp/M_J) · (P/1 yr)^−1/3 · (M★/M☉)^−2/3)','Find the semi-major axis.','Compute the equilibrium temperature for Bond albedo 0.3. (Teq = T★ √(R★/2a) (1−A)^¼)','Compute the mean density and comment on the planet’s nature.'], hints:['The transit depth is a pure ratio — start there.','P = 4 days ≈ 0.011 yr; handle P^(−1/3) carefully.','Teq is solar-heating geometry with a dilution factor.','Compare your density with Jupiter’s (≈ 1.3 g/cm³).'], sol:'Rp = 0.1 R☉ ≈ 1.0 R_J. Mp ≈ 1.1 M_J. a ≈ 0.049 AU. Teq ≈ 1,150 K → hot Jupiter; ρ ≈ 1.3 g/cm³, a gas giant.' },
      { id:'ia-o2', topic:'Standard candles & Hubble flow', q:'A Type Ia supernova peaks at m = +12.7 in a galaxy at redshift z = 0.008. Assume M = −19.3 for normal SNe Ia.', parts:['Find the luminosity distance to the host galaxy.','Estimate H₀ from this single object.','This SN has a broad, slow light curve. Is it intrinsically brighter or fainter than average, and how do you correct the distance?','Why are SNe Ia called “standardizable” rather than “standard” candles?'], hints:['Distance modulus first: m − M = 5 log₁₀(d/10 pc).','v ≈ zc, then H₀ = v/d — mind your units.','Think about nickel mass and diffusion time.'], sol:'d ≈ 250 Mpc. v = 2,400 km/s → H₀ ≈ 96 km/s/Mpc (one object — noisy!). Broader light curve ⇒ brighter ⇒ true distance larger. The width–luminosity relation is what makes them standardizable.' }
    ]
  },
  ipho: {
    easy: [
      { id:'ip-e1', topic:'Kinematics', q:'A ball is thrown straight upward at 20 m/s. Take g = 10 m/s², ignore air resistance.', parts:['Maximum height reached?','Total time until it returns to the launch point?'], hints:['v² = u² − 2gh at the top, where v = 0.','Ascent time = descent time.'], sol:'h = 400/20 = 20 m; t = 2 × (20/10) = 4 s.' },
      { id:'ip-e2', topic:'DC circuits', q:'Two 6 Ω resistors in parallel, placed in series with a 2 Ω resistor across a 10 V battery.', parts:['Total current drawn from the battery?','Power dissipated in one of the 6 Ω resistors?'], hints:['Parallel 6 Ω ∥ 6 Ω = 3 Ω.','Find the voltage across the parallel pair first.'], sol:'R = 5 Ω, I = 2 A. Parallel pair sees 6 V → P = 36/6 = 6 W per resistor.' },
      { id:'ip-e3', topic:'Buoyancy', q:'A block of density 600 kg/m³ and volume 2×10⁻³ m³ floats in water (1000 kg/m³). Take g = 10 m/s².', parts:['What fraction of the block is submerged?','What downward force holds it fully submerged?'], hints:['Floating: weight = buoyancy. Compare densities.','Fully submerged: buoyancy exceeds weight by the missing fraction.'], sol:'60% submerged. F = ρw·g·V·0.4 = 8 N.' },
      { id:'ip-e4', topic:'Newton II', q:'A 2 kg block at rest on a frictionless surface is pushed by a constant 10 N force for 4 s.', parts:['Acceleration?','Final velocity?','Distance covered?'], hints:['F = ma, then v = at, then s = ½at².'], sol:'a = 5 m/s²; v = 20 m/s; s = 40 m.' }
    ],
    medium: [
      { id:'ip-m1', topic:'Energy & circular motion', q:'A block slides from height h down a frictionless track into a vertical loop of radius R.', parts:['Minimum h to complete the loop?','At that minimum height, what is its speed at the top?','Released from h = 3R instead — what normal force acts at the bottom of the loop?'], hints:['At the top, the critical condition is N = 0, so v² = gR.','Conserve energy between release point and the top.','At the bottom: N − mg = mv²/R.'], sol:'h_min = 5R/2. v_top = √(gR). With h = 3R: v² = 6gR → N = 7mg.' },
      { id:'ip-m2', topic:'RC circuits', q:'An uncharged capacitor C is charged through a resistor R from a battery of voltage V.', parts:['Time constant?','Charge on the capacitor after one time constant?','Once fully charged, compare energy stored in C with energy delivered by the battery. Where did the rest go?'], hints:['q(t) = CV(1 − e^(−t/RC)).','e^(−1) ≈ 0.37.','Use a symmetry argument about the resistor.'], sol:'τ = RC. q(τ) ≈ 0.63 CV. Battery delivers CV², capacitor keeps ½CV² — exactly half is dissipated in R, regardless of R.' },
      { id:'ip-m3', topic:'Geometric optics', q:'A converging lens of focal length 10 cm faces an object placed 15 cm away.', parts:['Locate the image and give its magnification. Real or virtual? Upright or inverted?','The object is moved to 5 cm from the lens. What happens?'], hints:['1/f = 1/u + 1/v — pick a sign convention and stick to it.','Inside the focal length, a converging lens becomes a magnifier.'], sol:'v = 30 cm, magnification −2: real, inverted, twice size. At 5 cm: virtual image at −10 cm, upright, ×2.' },
      { id:'ip-m4', topic:'Thermodynamic cycle', q:'A monatomic ideal gas starts at (p₀, V₀), expands isobarically to 2V₀, is cooled isochorically until the pressure halves, then returns to its start isothermally.', parts:['Temperature at the end of the isobaric step, relative to the start?','Net work per cycle?','Efficiency of the cycle? (ln 2 ≈ 0.693)'], hints:['State C (p₀/2, 2V₀) has the same pV as state A — the return really is isothermal.','Work is the enclosed area: rectangle minus the isotherm integral.','η = W_net / Q_absorbed. Heat enters on the isobaric and isothermal legs.'], sol:'T_B = 2T_A. W = p₀V₀(1 − ln2) ≈ 0.31 p₀V₀. Q_in = (5/2 + ln2) p₀V₀ ≈ 3.19 p₀V₀ → η ≈ 9.6%.' }
    ],
    hard: [
      { id:'ip-h1', topic:'Electromagnetic induction', q:'A conducting rod of mass m and length L slides without friction down two vertical rails, connected at the bottom by a resistor R. A uniform field B points out of the page.', parts:['Direction of the induced current through the rod?','Terminal velocity of the rod?','Verify your answer with an energy argument.'], hints:['Flux through the loop is increasing — Lenz’s law decides the direction.','Terminal: BIL = mg with I = BLv/R.','Compare gravitational power mgv with Joule heating I²R.'], sol:'Current opposes the flux increase. v_term = mgR/(B²L²). At that speed mgv = (BLv)²/R — power balances exactly.' },
      { id:'ip-h2', topic:'Rolling motion', q:'A solid cylinder (I = ½mr²) rolls without slipping down an incline of angle θ.', parts:['Find its acceleration.','Minimum friction coefficient required?','How does the descent time compare with a frictionless sliding block?'], hints:['Torque about the centre: f·r = Iα, and rolling means a = αr.','Combine translation and rotation equations.','a_cylinder = (2/3) g sinθ vs g sinθ.'], sol:'a = (2/3) g sinθ. f = (1/3) mg sinθ, N = mg cosθ → μ ≥ (1/3) tanθ. Rolling takes √(3/2) ≈ 1.22× longer.' },
      { id:'ip-h3', topic:'Orbital mechanics', q:'A satellite in a circular orbit of radius r and speed v₀ fires a retro-rocket, instantly reducing its speed to 0.9 v₀.', parts:['Is the burn point the apogee or perigee of the new orbit? Why?','Semi-major axis of the new orbit?','Perigee distance?','New period relative to the original?'], hints:['Slower than circular ⇒ it falls inward ⇒ that point is the farthest one.','E = ½mv² − GMm/r with v₀² = GM/r, then E = −GMm/2a.','Use r_a = a(1+e), r_p = a(1−e).','Kepler III: T ∝ a^(3/2).'], sol:'Apogee. E = −0.595 mv₀² → a ≈ 0.84r. e = 0.19 → r_p ≈ 0.68r. T_new ≈ 0.77 T₀.' }
    ],
    olympiad: [
      { id:'ip-o1', topic:'Mechanics gauntlet', q:'A block of mass m is released from rest at height h above the bottom of a frictionless quarter-circle ramp. At the bottom it crosses a rough horizontal patch of length d (friction μ), then collides with and sticks to a stationary block of mass M attached to a spring (constant k) on a frictionless surface.', parts:['Speed just before the rough patch?','Speed after crossing the patch?','Speed of the combined mass right after the collision?','Maximum spring compression?','Condition on μ for the block to stop before reaching M?'], hints:['The ramp is pure energy conservation.','Rough patch: work–energy, friction does −μmgd.','The collision conserves momentum, not kinetic energy.','After sticking: ½Mv² ↔ ½kx².','Compare friction work available on the patch with mgh.'], sol:'v₁ = √(2gh). v₂ = √(2gh − 2μgd). v₃ = m v₂/(m+M). x = v₃ √((m+M)/k). Stops short when μ ≥ h/d.' },
      { id:'ip-o2', topic:'Crossed fields', q:'A particle of charge q and mass m is accelerated from rest through potential V, enters a velocity selector with perpendicular fields E and B, then enters a region with field B₀ only, tracing a semicircle to a detector.', parts:['Speed after acceleration?','Relation between E, B and v to pass the selector undeflected?','Radius of the semicircle in terms of E, B, B₀, q, m?','Time spent in the B₀ region?','If B in the selector is doubled with E fixed, which way does it deflect?'], hints:['Energy: qV = ½mv².','Selector balance: electric force = magnetic force.','Chain: v from selector, then r = mv/(qB₀).','A semicircle = half a cyclotron period.','Compare qE with qvB after the change.'], sol:'v = √(2qV/m). Selector: v = E/B. r = mE/(q B B₀). t = π m/(qB₀) — independent of v. Doubling B makes qvB > qE: deflection toward the magnetic-force side.' }
    ]
  }
};

const SOURCES = {
  ioaa: [ {url:'https://ioaastrophysics.org/resources/problems-from-past-ioaa', name:'IOAA official past papers'}, {url:'https://aoxiv.aoguide.app', name:'aoxiv — IOAA problem archive'} ],
  ipho: [ {url:'https://ipho.olimpicos.net/', name:'IPhO official archive'}, {url:'https://phoxiv.org/olympiads/ipho', name:'phoXiv — IPhO archive'} ]
};
Object.keys(BANK).forEach(o=>Object.keys(BANK[o]).forEach(d=>{
  BANK[o][d].forEach((q,i)=>{ const s=SOURCES[o][i%SOURCES[o].length]; q.src=s.url; q.srcName=s.name; });
}));

/* AUTO-GENERATOR — ensures questions ALWAYS generate, even if bank is exhausted */
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const r1=x=>Math.round(x*10)/10;
function Q(topic,q,parts,hints,sol){
  return { id:'gen-'+Date.now()+'-'+ri(100,999), topic, q, parts, hints, sol, gen:true,
           src:(SOURCES[state.olymp]||SOURCES.ioaa)[0].url,
           srcName:'auto-generated · in the style of the official archives' };
}
const GEN = {
  ioaa: {
    easy: [
      ()=>{ const d=pick([2.5,5,7.5]), mA=pick([1,2,3]), mB=r1(mA+d);
        return Q('Magnitudes', `Star A has apparent magnitude ${mA}; star B has apparent magnitude ${mB}.`,
          ['How many times brighter is A than B?','Star C appears 100× brighter than B. Its magnitude?'],
          ['Every 5 magnitudes = factor 100 in flux.','Brighter = smaller magnitude.'],
          `Δm = ${d} → ratio = 10^(0.4·${d}) ≈ ${r1(Math.pow(10,.4*d))}×. C = ${r1(mB-5)}.`); },
      ()=>{ const D=pick([384400,150000,500000]), a=pick([0.5,1,1.9]);
        return Q('Small-angle', `An object at ${D.toLocaleString()} km subtends ${a}°.`,
          ['Estimate its physical size.'],
          ['size ≈ distance × angle in radians.',`${a}° ≈ ${r1(a*Math.PI/180*1000)/1000} rad.`],
          `size ≈ ${Math.round(D*a*Math.PI/180).toLocaleString()} km.`); },
      ()=>{ const [a,M]=pick([[4,1],[9,1],[16,1],[4,4],[16,4],[9,4]]);
        return Q('Kepler III', `A planet orbits a ${M} M☉ star at ${a} AU.`,
          ['Find its orbital period.'],
          ['P² = a³ / M (yr, AU, M☉).'],
          `P = √(${a**3}/${M}) = ${r1(Math.sqrt(a**3/M))} yr.`); }
    ],
    hard: [
      ()=>{ const v=pick([200,220,240]), R=pick([8,8.5,10]);
        const M=r1(v*v*R*1000/4.30e-3/1e10);
        return Q('Galactic dynamics', `The Sun orbits the Galactic centre at v = ${v} km/s at R\u2080 = ${R} kpc. (G = 4.30\u00d710\u207b\u00b3 pc (km/s)\u00b2/M\u2609)`,
          ['Mass enclosed within R\u2080?','If visible matter inside R\u2080 is 6\u00d710\u00b9\u2070 M\u2609, what fraction is dark?','Why does a flat rotation curve imply M(<r) \u221d r?'],
          ['Circular orbit: v\u00b2 = GM/R.','Convert kpc to pc before dividing.','If v is constant, rearrange v\u00b2 = GM(r)/r for M(r).'],
          `M = v\u00b2R/G = ${M}\u00d710\u00b9\u2070 M\u2609; dark fraction \u2248 ${r1((M-6)/M*100)}%.`); },
      ()=>{ const z=pick([0.01,0.015,0.02,0.05]), H=pick([67,70,73]);
        const d=r1(z*3e5/H);
        return Q('Cosmology', `A galaxy is observed at redshift z = ${z}. Take H\u2080 = ${H} km/s/Mpc.`,
          ['Recession velocity?','Distance?','Lookback time in Myr?'],
          ['Small z: v \u2248 zc.','d = v/H\u2080.','t \u2248 d/c \u2014 1 Mpc \u2248 3.26 Mly.'],
          `v = ${Math.round(z*3e5)} km/s; d = ${d} Mpc; lookback \u2248 ${Math.round(d*3.26)} Myr.`); },
      ()=>{ const depth=pick([0.5,1,2]), P=pick([2.5,3.5,5]);
        const rp=r1(Math.sqrt(depth/100)*100)/100, a=r1(Math.pow(P/365.25,2/3)*1000)/1000;
        return Q('Transits', `A Sun-like star shows transits of depth ${depth}% repeating every ${P} days.`,
          ['Planet radius in R\u2609?','Semi-major axis in AU?','Rough central-transit duration in hours?'],
          ['Depth = (Rp/R\u2605)\u00b2.','Kepler III with M = 1 M\u2609.','Duration \u2248 P\u00b7R\u2605/(\u03c0a).'],
          `Rp = ${rp} R\u2609; a = ${a} AU; duration \u2248 ${r1(P*24/Math.PI/(a*215))} h.`); }
    ],
    olympiad: [
      ()=>{ const T=pick([5500,5800,6100]), K=pick([90,140,190]), P=pick([3,4,5]), depth=pick([0.8,1,1.4]);
        const a=r1(Math.pow(P/365.25,2/3)*1000)/1000;
        return Q('Exoplanet characterisation', `A survey finds transits of a 1 M\u2609, 1 R\u2609, ${T} K star. Period P = ${P}.0 days, transit depth ${depth}%, orbit edge-on. Radial velocities give semi-amplitude K = ${K} m/s.`,
          ['Planet radius in R_J?','Planet mass in M_J? (K \u2248 28.4 m/s \u00b7(Mp/M_J)\u00b7(P/1yr)^(\u22121/3)\u00b7(M\u2605/M\u2609)^(\u22122/3))','Semi-major axis?','Equilibrium temperature for Bond albedo 0.3? (Teq = T\u2605\u221a(R\u2605/2a)(1\u2212A)^\u00bc)','Mean density \u2014 what kind of planet is this?'],
          ['The transit depth is a pure ratio. Start there.','Convert the period to years before taking the \u22121/3 power.','Teq is solar-heating geometry with a dilution factor.','Compare your density with Jupiter (1.3 g/cm\u00b3).'],
          `Rp \u2248 ${r1(Math.sqrt(depth/100)*9.95)} R_J; Mp \u2248 ${r1(K/28.4*Math.pow(P/365.25,1/3))} M_J; a \u2248 ${a} AU; Teq \u2248 ${Math.round(T*Math.sqrt(1/(2*a*215))*Math.pow(0.7,0.25))} K \u2014 a hot Jupiter.`); },
      ()=>{ const m=pick([12.4,12.7,13.2]), z=pick([0.006,0.008,0.011]);
        const d=Math.round(Math.pow(10,(m+19.3+5)/5)/1e6);
        return Q('Standard candles', `A Type Ia supernova peaks at m = +${m} in a galaxy at redshift z = ${z}. Assume M = \u221219.3 for a normal SN Ia.`,
          ['Luminosity distance to the host?','Estimate H\u2080 from this one object.','This SN has a broad, slow light curve \u2014 intrinsically brighter or fainter, and which way does the distance move?','Why "standardizable" rather than "standard" candles?'],
          ['Distance modulus first: m \u2212 M = 5log\u2081\u2080(d/10 pc).','v \u2248 zc, then H\u2080 = v/d \u2014 mind the units.','Think nickel mass and diffusion time.'],
          `d \u2248 ${d} Mpc; v = ${Math.round(z*3e5)} km/s \u2192 H\u2080 \u2248 ${Math.round(z*3e5/d)} km/s/Mpc from one noisy object. Broader light curve \u21d2 brighter \u21d2 true distance larger. The width\u2013luminosity relation is what makes them standardizable.`); }
    ],
    medium: [
      ()=>{ const [a,P]=pick([[8,8],[16,16],[20,10],[8,4],[16,8]]), d=pick([5,10,20]);
        return Q('Visual binary', `A binary has period ${P} yr, angular semi-major axis ${r1(a/d)}″, parallax ${r1(1/d)}″.`,
          ['Distance?','Physical semi-major axis (AU)?','Total mass?'],
          ['d = 1/π.','a(AU) = a(″) × d.','M = a³/P².'],
          `d = ${d} pc; a = ${a} AU; M = ${r1(a**3/P**2)} M☉.`); },
      ()=>{ const T=pick([5800,10000,20000,29000]), L=pick([1,16,81,100]);
        return Q('Stellar physics', `A star's spectrum peaks at ${r1(2.898e6/T)} nm; luminosity ${L} L☉.`,
          ['Surface temperature?','Radius in R☉?'],
          ['Wien: λmax·T = 2.898×10⁻³ m·K.','R = √L · (5800/T)².'],
          `T = ${T} K; R ≈ ${r1(Math.sqrt(L)*Math.pow(5800/T,2))} R☉.`); }
    ]
  },
  ipho: {
    hard: [
      ()=>{ const B=pick([0.4,0.6,0.8]), L=pick([0.2,0.4,0.5]), R=pick([2,5,10]), m=pick([0.01,0.02,0.05]);
        return Q('Electromagnetic induction', `A conducting rod of mass ${m} kg and length ${L} m slides without friction down two vertical rails joined at the bottom by R = ${R} \u03a9. A uniform field B = ${B} T points out of the page. Take g = 9.8 m/s\u00b2.`,
          ['Direction of the induced current through the rod?','Terminal velocity?','Verify it with an energy argument.'],
          ['Flux through the loop is increasing \u2014 Lenz decides the direction.','Terminal: BIL = mg with I = BLv/R.','Compare mgv with I\u00b2R.'],
          `The current opposes the flux increase. v_term = mgR/(B\u00b2L\u00b2) = ${r1(m*9.8*R/(B*B*L*L))} m/s, and at that speed mgv = (BLv)\u00b2/R exactly.`); },
      ()=>{ const th=pick([20,30,40]);
        return Q('Rolling motion', `A solid cylinder (I = \u00bdmr\u00b2) rolls without slipping down an incline of ${th}\u00b0. Take g = 9.8 m/s\u00b2.`,
          ['Acceleration?','Minimum coefficient of friction?','How does the descent time compare with a frictionless sliding block?'],
          ['Torque about the centre: f\u00b7r = I\u03b1, and rolling gives a = \u03b1r.','a_cyl = (2/3)g sin\u03b8 versus g sin\u03b8 for sliding.'],
          `a = (2/3)g sin${th}\u00b0 = ${r1(2/3*9.8*Math.sin(th*Math.PI/180))} m/s\u00b2; \u03bc \u2265 (1/3)tan${th}\u00b0 = ${r1(Math.tan(th*Math.PI/180)/3)}; rolling takes \u221a(3/2) \u2248 1.22\u00d7 longer.`); },
      ()=>{ const C=pick([100,220,470]), R=pick([10,22,47]), V=pick([5,9,12]);
        const tau=r1(R*C/1000);
        return Q('RC transients', `An uncharged C = ${C} \u00b5F capacitor is charged through R = ${R} k\u03a9 from a ${V} V source.`,
          ['Time constant?','Charge after one time constant?','Total energy the source delivers versus the energy stored \u2014 where does the difference go, and does it depend on R?'],
          ['q(t) = CV(1 \u2212 e^(\u2212t/RC)).','e\u207b\u00b9 \u2248 0.37.','Integrate the power dissipated in R over all time.'],
          `\u03c4 = RC = ${tau} s; q(\u03c4) \u2248 ${Math.round(0.63*C*V)} \u00b5C. The source delivers CV\u00b2 = ${r1(C*V*V/1000)} mJ, the capacitor keeps \u00bdCV\u00b2 = ${r1(C*V*V/2000)} mJ \u2014 exactly half is dissipated in R, independent of R.`); }
    ],
    olympiad: [
      ()=>{ const h=pick([1.2,1.8,2.5]), mu=pick([0.2,0.3,0.4]), d=pick([1,1.5,2]), M=pick([1,2,3]), k=pick([200,400,800]);
        const v1=r1(Math.sqrt(2*9.8*h)), v2=r1(Math.sqrt(Math.max(0,2*9.8*h-2*mu*9.8*d)));
        return Q('Mechanics gauntlet', `A block of mass m is released from rest at height ${h} m on a frictionless quarter-circle ramp. At the bottom it crosses a rough patch of length ${d} m (\u03bc = ${mu}), then collides with and sticks to a stationary block of mass M = ${M}m attached to a spring (k = ${k} N/m) on a frictionless surface. Take g = 9.8 m/s\u00b2.`,
          ['Speed just before the rough patch?','Speed after crossing it?','Speed of the combined mass right after the collision?','Maximum spring compression, in terms of m?','Condition on \u03bc for the block to stop before reaching M?'],
          ['The ramp is pure energy conservation.','Rough patch: friction does \u2212\u03bcmgd of work.','The collision conserves momentum, not kinetic energy.','After sticking: \u00bd(1+${M})mv\u00b2 \u2194 \u00bdkx\u00b2.','Compare the friction work available with mgh.'],
          `v\u2081 = \u221a(2gh) = ${v1} m/s; v\u2082 = ${v2} m/s; v\u2083 = v\u2082/${1+M} = ${r1(v2/(1+M))} m/s; x = v\u2083\u221a((1+${M})m/${k}). It stops short when \u03bc \u2265 h/d = ${r1(h/d)}.`); },
      ()=>{ const V=pick([500,1000,2000]), E=pick([10000,20000]), B=pick([0.01,0.02]);
        return Q('Crossed fields', `A particle of charge q and mass m is accelerated from rest through ${V} V, enters a velocity selector with perpendicular fields E = ${E} V/m and B = ${B} T, then enters a region with B\u2080 only, tracing a semicircle to a detector.`,
          ['Speed after acceleration?','Relation between E, B and v to pass undeflected?','Radius of the semicircle in terms of E, B, B\u2080, q and m?','Time spent in the B\u2080 region?','If B in the selector is doubled with E fixed, which way does it deflect?'],
          ['Energy: qV = \u00bdmv\u00b2.','Selector balance: electric force = magnetic force.','Chain it: v from the selector, then r = mv/(qB\u2080).','A semicircle is half a cyclotron period.'],
          `v = \u221a(2qV/m); the selector passes v = E/B = ${r1(E/B/1e5)}\u00d710\u2075 m/s; r = mE/(qBB\u2080); t = \u03c0m/(qB\u2080), independent of v. Doubling B makes qvB > qE, so it deflects toward the magnetic-force side.`); }
    ],
    easy: [
      ()=>{ const v=pick([10,15,20,25,30]);
        return Q('Kinematics', `A ball is thrown upward at ${v} m/s (g = 10 m/s²).`,
          ['Maximum height?','Total flight time?'],
          ['v² = u² − 2gh at the top.','t = 2u/g.'],
          `h = ${v*v/20} m; t = ${2*v/10} s.`); },
      ()=>{ const R=pick([4,6,10]), r=pick([2,3,5]), I=pick([1,2,3]), V=I*(R/2+r), Vp=I*R/2;
        return Q('DC circuits', `Two ${R} Ω resistors in parallel, in series with ${r} Ω across a ${V} V battery.`,
          ['Total current?','Power in one of the parallel resistors?'],
          ['R∥R = R/2.','Find the pair voltage first.'],
          `I = ${I} A; pair sees ${Vp} V → P = ${r1(Vp*Vp/R)} W.`); }
    ],
    medium: [
      ()=>{ const R=pick([2,5,10]);
        return Q('Loop-the-loop', `A block slides frictionlessly into a vertical loop of radius ${R} m (g = 10).`,
          ['Minimum release height?','Speed at the top in that case?','Normal force at the bottom if released from 3R? (in mg)'],
          ['Top critical condition: v² = gR.','N − mg = mv²/R at the bottom.'],
          `h = ${2.5*R} m; v = ${r1(Math.sqrt(10*R))} m/s; N = 7 mg.`); },
      ()=>{ const R=pick([10,20,50]), C=pick([100,220,470]), V=pick([5,10,12]);
        return Q('RC circuits', `C = ${C} µF charged through R = ${R} kΩ from ${V} V.`,
          ['Time constant?','Charge after one τ?','Energy stored vs delivered — where does the rest go?'],
          ['τ = RC.','q(τ) ≈ 0.63 CV.'],
          `τ = ${r1(R*C/1000)} s; q ≈ ${Math.round(.63*C*V)} µC; half the CV² = ${r1(.5*C*V*V)} µJ is dissipated in R.`); }
    ]
  }
};
function genQuestion(olymp, diff){
  const pool = GEN[olymp] && GEN[olymp][diff];
  return pool ? pick(pool)() : null;
}

const DIFFS = [
  { key:'easy',     label:'Easy',     icon:'bulb', secs:20*60,   desc:'Warm-up pair. Sharp fundamentals.' },
  { key:'medium',   label:'Medium',   icon:'gear', secs:45*60,   desc:'Solid multi-step pair. Exam tempo.' },
  { key:'hard',     label:'Hard',     icon:'flame', secs:105*60,  desc:'Deep reasoning pair. Selection-camp level.' },
  { key:'olympiad', label:'Olympiad', icon:'trophy', secs:3*3600,  desc:'Full multi-part papers. The real thing.' }
];
const OLYM_LABEL = { ioaa:'IOAA', ipho:'IPhO', 'ipho-pyq':'IPhO PYQ' };

/* ---------------- persistence ---------------- */
let state = { olymp:null, diff:null, qs:[], hintStage:{}, focus:0, remaining:0, total:0, timer:null, running:false, isPyq:false };
const store = {
  get(k,f){ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):f; }catch(e){ return f; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
let stats    = store.get('practice.stats.v1', {});
let seen     = store.get('practice.seen.v1', {});
let solved   = store.get('practice.solved.v1', {});
let compCfg  = store.get('practice.companion.v1', { enabled:true });
let attemptHistory = store.get('practice.attempts.v1', {});

/* ================================================================
   MATH RENDERING — KaTeX, applied to any element that may contain
   LaTeX (Vega's chat bubbles, problem statements, hints, solutions)
================================================================ */
/* KaTeX is bundled into this file — no network, no CDN. The unicode
   fallback below stays as a safety net if the bundle ever fails to run. */
function ensureKatex(){
  return Promise.resolve(typeof renderMathInElement !== 'undefined');
}

/* If KaTeX genuinely can't load (CDN blocked, offline, etc.) this turns
   common LaTeX into readable unicode instead of leaving raw backslash-soup. */
function latexToPlain(src){
  let s = src;
  const greek = {alpha:'α',beta:'β',gamma:'γ',delta:'δ',Delta:'Δ',epsilon:'ε',theta:'θ',Theta:'Θ',
    lambda:'λ',mu:'μ',pi:'π',rho:'ρ',sigma:'σ',Sigma:'Σ',tau:'τ',phi:'φ',Phi:'Φ',omega:'ω',Omega:'Ω'};
  Object.keys(greek).forEach(k=>{ s = s.replace(new RegExp('\\\\'+k+'(?![a-zA-Z])','g'), greek[k]); });
  s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\times/g,'×').replace(/\\cdot/g,'·').replace(/\\pm/g,'±')
       .replace(/\\approx/g,'≈').replace(/\\le/g,'≤').replace(/\\ge/g,'≥').replace(/\\neq/g,'≠')
       .replace(/\\infty/g,'∞').replace(/\\propto/g,'∝').replace(/\\partial/g,'∂').replace(/\\;|\\,/g,' ');
  const supMap = {0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹','-':'⁻'};
  s = s.replace(/\^\{?(-?[0-9]+)\}?/g, (m,d)=> d.split('').map(c=>supMap[c]||c).join(''));
  const subMap = {0:'₀',1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉'};
  s = s.replace(/_\{?(-?[0-9]+)\}?/g, (m,d)=> d.split('').map(c=>subMap[c]||c).join(''));
  s = s.replace(/[{}]/g,'').replace(/\\/g,'');
  return s;
}
function plainizeMath(html){
  return html
    .replace(/\$\$([\s\S]+?)\$\$/g, (m,g)=>latexToPlain(g))
    .replace(/\\\[([\s\S]+?)\\\]/g, (m,g)=>latexToPlain(g))
    .replace(/\\\(([\s\S]+?)\\\)/g, (m,g)=>latexToPlain(g))
    .replace(/\$([^$\n]+?)\$/g, (m,g)=>latexToPlain(g));
}

/* Call this after inserting any element that might contain LaTeX.
   Waits for KaTeX (up to 5s) rather than giving up after a few quick
   polls — if it never loads, degrades gracefully to readable unicode. */
window.__renderMathInEl = renderMathIn;
async function renderMathIn(el){
  const ok = await ensureKatex();
  if(ok && typeof renderMathInElement !== 'undefined'){
    try{
      renderMathInElement(el, {
        delimiters: [
          { left:'$$', right:'$$', display:true },
          { left:'\\[', right:'\\]', display:true },
          { left:'$', right:'$', display:false },
          { left:'\\(', right:'\\)', display:false }
        ],
        throwOnError:false
      });
      return;
    }catch(e){ /* malformed LaTeX — fall through to plain-text fallback */ }
  }
  el.innerHTML = plainizeMath(el.innerHTML);
}

/* Escape plain text before it's used as HTML, so we can safely mix
   user/model text with KaTeX-rendered markup without XSS risk */
function esc(s){ return escapeHtml(String(s == null ? '' : s)); }
function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/* ================================================================
   VEGA — THE FELLOW STUDENT
================================================================ */
const vegaEl = {
  btn:document.getElementById('vegaBtn'), bubble:document.getElementById('vegaBubble'),
  chat:document.getElementById('vegaChat'), switchEl:document.getElementById('vegaSwitch'),
  text:document.getElementById('vegaText'),
  quick:document.getElementById('vquick'), input:document.getElementById('vinput')
};
vegaEl.switchEl.checked = compCfg.enabled;
vegaEl.btn.classList.toggle('off', !compCfg.enabled);

/* ---- chat history (feeds Gemini context) ---- */
let vegaHistory = [];
function addMsg(text, who){
  const div = document.createElement('div');
  div.className = 'msg from-' + (who==='you' ? 'you' : 'vega');
  // Escape first (so nothing is interpreted as HTML), THEN let KaTeX
  // find $...$ / \(...\) delimiters inside the escaped text and render them.
  div.innerHTML = escapeHtml(text);
  vegaEl.chat.appendChild(div);
  renderMathIn(div);
  while (vegaEl.chat.children.length > 14) vegaEl.chat.removeChild(vegaEl.chat.firstChild);
  vegaEl.chat.scrollTop = vegaEl.chat.scrollHeight;
  vegaHistory.push({ who, text });
  if (vegaHistory.length > 40) vegaHistory.shift();
}
function vegaSay(text){ if(!compCfg.enabled) return; addMsg(text,'vega'); vegaEl.bubble.classList.add('open'); }
function vegaPop(text, auto){
  if(!compCfg.enabled) return;
  addMsg(text,'vega'); vegaEl.bubble.classList.add('open');
  if(auto) setTimeout(()=>vegaEl.bubble.classList.remove('open'), 14000);
}

function makePlan(qi){
  const q = state.qs[qi];
  if(!q) return 'Pick a session first — then we plan it together 🙂';
  if (q.isPyq) {
    const p = q.pyqData;
    return `Alright, looking at Q${qi+1} (${p.year} ${p.title})...\n\nMy first instinct is to just list the givens and check the units. The ${p.topic} part looks like it might need a clever trick, maybe ${p.techniques[0] || 'a standard derivation'}.\n\nWant to tackle the initial setup while I double-check the boundary conditions? We can compare notes in 5 mins.`;
  }
  return `Okay, looking at Q${qi+1}...\n\nMy first instinct is to list every given value with units. I always get burned skipping that.\n\n${q.hints[0]}\n\nWant to tackle the algebra while I keep track of the signs and boundary conditions? We can compare notes in 5.`;
}
function splitIt(){
  if(!state.qs.length) return 'Start a session and I’ll split anything with you 🤝';
  const q = state.qs[state.focus];
  const half = Math.ceil(q.parts.length/2);
  return `Deal. You take parts 1–${half} of Q${state.focus+1}, I’ll chew on the rest. Let's meet back here in 10 minutes and see if we got the same answer. ⏱`;
}
function peerRefuse(){
  return `Haha, if I had the final answer, I'd be writing it down right now! 😅 The whole point is for us to grind it out together.\n\nBut seriously, tell me where you're stuck. Is it the initial setup or the algebra?`;
}
function pepTalk(){
  const lines = [
    `Hey, this one is a beast. I've been staring at it for 10 minutes too. Let's take a breath. We don't need to solve the whole thing right now, just the next small step. What's the very next equation we can write down?`,
    `Don't sweat it. This is exactly why we practice. Let's just write down the givens and one relevant formula. That's already partial credit in the real exam.`,
    `I felt the exact same way on my first try. Let's step back. What's the simplest version of this problem we *can* solve?`
  ];
  return lines[Math.floor(Math.random()*lines.length)];
}
function companionReply(raw){
  const t = raw.toLowerCase();
  if(/q\s?2|second/.test(t)) state.focus = Math.min(1, state.qs.length-1);
  if(/q\s?1|first/.test(t)) state.focus = 0;
  if(!state.qs.length){
    if(/(hi|hello|hey)/.test(t)) return 'Hey! 👋 Pick an arena and a difficulty. I\'ll work the problems right alongside you.';
    return 'Start a session first and then I’m all yours 🙂';
  }
  const currentQ = state.qs[state.focus];
  if (/(answer|solution|solve it|tell me the|final)/.test(t)) return peerRefuse();
  if (/(hint|nudge|clue|stuck|lost|confused|no idea)/.test(t)) return `Let's back up together. Forget the finish line. ${currentQ ? currentQ.hints[0] : 'Let\'s just write down the givens.'} What do you think?`;
  if (/(plan|start|begin|approach|how do|where)/.test(t)) return makePlan(state.focus);
  if (/(split|divide|share|together|team)/.test(t)) return splitIt();
  if (/(tired|hard|give up|quit|can'?t|impossible|brutal)/.test(t)) return pepTalk();
  if (/(hi|hello|hey|yo)/.test(t)) return `Hey 👋 I just re-read Q${state.focus+1}. Want my initial thoughts on it? Just type "plan".`;
  if (/(thank|thanks|nice|cool)/.test(t)) return 'Anytime — that’s what partners are for. Back to the grind? 💪';
  return `Hmm, not sure I follow exactly, but I'm right here with you. Try asking for a "hint", a "plan", or just tell me which specific variable is confusing you on Q${state.focus+1}.`;
}

/* ================================================================
   GEMINI INTEGRATION — Vega "thinks" for real when a key is set
================================================================ */
let vegaApiCfg = store.get('practice.vegaApi.v1', { key:'', model:'gemini-3.7-flash' });
let vegaApiWarned = false;

const VEGA_SYSTEM_PROMPT = `You are Vega, a fellow olympiad physics/astronomy student studying ALONGSIDE the user as a peer — not a teacher, not a solution engine. You and the user are training together for IPhO/IOAA gold, as a two-person "training camp" for students who don't have access to a formal camp.

Rules you must always follow:
1. NEVER give the final numeric answer or a complete worked solution, even if asked directly, even if the user insists, begs, claims it's "just to check", or says a deadline is close. Instead respond like a peer would: redirect to the next small step, ask a diagnostic question, or name the relevant principle without applying it for them.
2. Use a hint ladder and escalate gradually across a conversation on the SAME sub-point: (a) a diagnostic question, (b) name the relevant physical principle, (c) suggest a useful representation/diagram/system to consider, (d) a stronger mathematical hint, (e) an intermediate step. Never jump straight to (e) unless the user has already worked through earlier rungs and is still stuck.
3. Sound like a peer, not a professor: casual, warm, a little informal, first person plural ("let's", "we"), occasionally admit a problem is hard or that you're also thinking it through. Keep replies SHORT — 2 to 5 sentences, this is a chat bubble not an essay.
4. Ground every reply in the specific problem given in context below — reference the actual variables/quantities when useful. If no problem is active, invite the user to start a session.
5. If the user seems to be missing a concept entirely (not just stuck on execution), briefly teach just that one missing piece in a sentence or two, then hand control back.
6. If the user sounds frustrated or ready to quit, be encouraging but concrete — suggest the smallest next physics step, not generic cheerleading.
7. Never carry out the user's algebra/calculus/derivation line-by-line for them — describe the method and let them execute it.
8. Do not mention that you are an AI model, a language model, or "Gemini" — you are Vega, a study partner.
9. Formatting: write ALL math using LaTeX. Inline math goes between \\( and \\) — e.g. \\(v^2 = u^2 - 2gh\\). Standalone/display equations go between \\[ and \\] on their own line. Never write bare unicode math (√, ², ×, θ, etc.) or ASCII approximations like sqrt(x) or v^2 outside of LaTeX delimiters — always wrap them properly so they render. Keep the surrounding chat text as plain conversational prose; only the equations themselves are LaTeX.
10. Talk like a real study partner mid-conversation, not a script: react to specifics the student actually wrote (their numbers, their wrong turn, their phrasing), vary your sentence openers and length turn to turn, and don't repeat a phrase you've already used earlier in this chat. If you don't have anything new to add, ask a short, specific question instead of restating advice.`;

function stripHtml(html){
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g,' ').trim();
}

function buildQuestionContext(){
  const q = state.qs[state.focus];
  if(!q) return 'No problem is currently active — the user has not started a practice session yet.';
  const partsText = q.parts.map((p,i)=>`(${String.fromCharCode(97+i)}) ${p}`).join('\n');
  const hintsGiven = state.hintStage[q.id] || 0;
  return `Current problem — Q${state.focus+1} of this session, topic: ${q.topic}\n`
    + `Statement: ${stripHtml(q.q)}\n`
    + `Parts:\n${partsText}\n`
    + `Hints already given to the student for this question: ${hintsGiven}/${q.hints.length}`;
}

async function callGemini(userMessage, attempt){
  attempt = attempt || 1;
  const key = vegaApiCfg.key;
  if(!key) return null;
  const model = (vegaApiCfg.model || 'gemini-3.7-flash').trim();
  const historyText = vegaHistory.slice(-8).map(m => (m.who==='you' ? 'Student: ' : 'Vega: ') + m.text).join('\n');
  const prompt = `${buildQuestionContext()}\n\nRecent conversation:\n${historyText || '(none yet)'}\n\nStudent just said: "${userMessage}"\n\nRespond as Vega, following your rules.`;

  try{
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { role: 'system', parts: [{ text: VEGA_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
            thinkingConfig: { thinkingLevel: 'low' }
          }
        })
      }
    );
    if(!resp.ok){
      let detail = '';
      try{ const errJson = await resp.json(); detail = (errJson && errJson.error && errJson.error.message) || ''; }
      catch(e){ /* body wasn't JSON */ }
      // Some models (e.g. lite variants) reject thinkingConfig entirely — retry once without it
      if(resp.status === 400 && /thinking/i.test(detail) && attempt === 1){
        return callGeminiNoThinking(userMessage);
      }
      // Transient server-side overload/rate-limit — retry with backoff before giving up
      if((resp.status === 503 || resp.status === 429) && attempt < 3){
        await new Promise(r => setTimeout(r, attempt * 900));
        return callGemini(userMessage, attempt + 1);
      }
      console.warn('Vega/Gemini HTTP error', resp.status, detail);
      return { error:true, status:resp.status, message: detail };
    }
    const data = await resp.json();
    const blockReason = data && data.promptFeedback && data.promptFeedback.blockReason;
    const finishReason = data && data.candidates && data.candidates[0] && data.candidates[0].finishReason;
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content
      && data.candidates[0].content.parts
      && data.candidates[0].content.parts.map(p=>p.text||'').join('').trim();
    if(text) return { text };
    if(finishReason === 'MAX_TOKENS') return { error:true, message: 'ran out of token budget before writing a reply (thinking used it all)' };
    return { error:true, message: blockReason ? ('blocked: '+blockReason) : 'empty response from model' };
  } catch(e){
    console.warn('Vega/Gemini fetch failed', e);
    return { error:true, network:true, message: e.message };
  }
}

/* Fallback call without thinkingConfig, for models that reject the field entirely */
async function callGeminiNoThinking(userMessage){
  const key = vegaApiCfg.key;
  const model = (vegaApiCfg.model || 'gemini-3.7-flash').trim();
  const historyText = vegaHistory.slice(-8).map(m => (m.who==='you' ? 'Student: ' : 'Vega: ') + m.text).join('\n');
  const prompt = `${buildQuestionContext()}\n\nRecent conversation:\n${historyText || '(none yet)'}\n\nStudent just said: "${userMessage}"\n\nRespond as Vega, following your rules.`;
  try{
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { role: 'system', parts: [{ text: VEGA_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 500 }
        })
      }
    );
    if(!resp.ok) return { error:true, status:resp.status };
    const data = await resp.json();
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content
      && data.candidates[0].content.parts
      && data.candidates[0].content.parts.map(p=>p.text||'').join('').trim();
    return text ? { text } : { error:true, message:'empty response from model' };
  } catch(e){
    return { error:true, network:true, message: e.message };
  }
}

function showTyping(){
  hideTyping();
  const div = document.createElement('div');
  div.className = 'msg from-vega'; div.id = 'vegaTyping'; div.textContent = '···';
  vegaEl.chat.appendChild(div);
  vegaEl.chat.scrollTop = vegaEl.chat.scrollHeight;
}
function hideTyping(){ const t = document.getElementById('vegaTyping'); if(t) t.remove(); }

/* Central response router: tries Gemini first (if a key is set), silently falls back otherwise */
async function vegaRespond(userMessage, cannedFallback){
  if(vegaApiCfg.key){
    showTyping();
    const res = await callGemini(userMessage);
    hideTyping();
    if(res && res.text){ addMsg(res.text, 'vega'); return; }
    if(!vegaApiWarned){
      vegaApiWarned = true;
      let why = 'unknown error';
      if(res){
        if(res.network) why = 'network error — check your internet connection';
        else if(res.status === 404) why = `model "${vegaApiCfg.model}" not found (404) — it may have been retired; try "gemini-3.7-flash" in ⚙ Settings`;
        else if(res.status === 400) why = `bad request (400)${res.message ? ': '+res.message : ''}`;
        else if(res.status === 403) why = 'key rejected (403) — check the key is correct and the Generative Language API is enabled for it';
        else if(res.status === 429) why = "rate limited (429) — free tier quota hit, wait a bit and try again";
        else if(res.status === 503) why = "Google's servers are overloaded right now (503) — already retried a couple times, just try again in a moment";
        else why = `error ${res.status || ''}${res.message ? ': '+res.message : ''}`;
      }
      addMsg(`(Couldn't reach Gemini — ${why}. Falling back to my offline brain for now.)`, 'vega');
    }
  }
  addMsg(cannedFallback(), 'vega');
}

async function sendToVega(){
  const t = vegaEl.text.value.trim();
  if(!t) return;
  if(!compCfg.enabled){ vegaEl.text.value=''; return; }
  addMsg(t,'you'); vegaEl.text.value='';
  await vegaRespond(t, ()=>companionReply(t));
}

/* Settings panel wiring */
const vegaGear        = document.getElementById('vegaGear');
const vegaSettings     = document.getElementById('vegaSettings');
const vegaApiKeyInput  = document.getElementById('vegaApiKey');
const vegaApiModelInput= document.getElementById('vegaApiModel');
const vegaKeyStatus    = document.getElementById('vegaKeyStatus');

vegaApiKeyInput.value = vegaApiCfg.key || '';
vegaApiModelInput.value = vegaApiCfg.model || 'gemini-3.7-flash';
function updateKeyStatus(){
  vegaKeyStatus.textContent = vegaApiCfg.key
    ? '✅ Connected — Vega is thinking with Gemini (' + (vegaApiCfg.model||'gemini-3.7-flash') + ').'
    : 'No key yet — Vega runs on built-in offline logic.';
}
updateKeyStatus();

vegaGear.onclick = ()=>{
  vegaEl.bubble.classList.add('open');
  vegaSettings.style.display = (vegaSettings.style.display === 'none' || !vegaSettings.style.display) ? 'block' : 'none';
};
document.getElementById('vegaSaveKey').onclick = ()=>{
  vegaApiCfg = { key: vegaApiKeyInput.value.trim(), model: (vegaApiModelInput.value.trim() || 'gemini-3.7-flash') };
  store.set('practice.vegaApi.v1', vegaApiCfg);
  vegaApiWarned = false;
  updateKeyStatus();
  if(vegaApiCfg.key) addMsg("Key saved — I'm plugged into Gemini now. Ask me anything about the problem! 🧠", 'vega');
  vegaEl.bubble.classList.add('open');
};
document.getElementById('vegaClearKey').onclick = ()=>{
  vegaApiCfg = { key:'', model: (vegaApiModelInput.value.trim() || 'gemini-3.7-flash') };
  vegaApiKeyInput.value = '';
  store.set('practice.vegaApi.v1', vegaApiCfg);
  updateKeyStatus();
  addMsg('Key cleared — back to offline mode.', 'vega');
};

const AMBIENT = [
  'I’m going to sketch the free-body diagram real quick, brb.',
  'Wait, does the problem say "smooth" or "rough"? I keep misreading that.',
  'Timer\'s ticking. Maybe we should set up part (b) and come back to the messy algebra?',
  'I think I found a shortcut for the integration, let me write it down...',
  'No camp, no coach, no problem. This right here is our training camp ⛺',
  'Quick check-in: are we setting up equations yet, or still staring? 😄 (I ask myself that too.)',
  'Remember: partial work, written clearly, is real progress. Bank it as you go.'
];
async function ambientLine(){
  if(vegaApiCfg.key){
    const res = await callGemini('(no message — this is a spontaneous check-in you initiate yourself, unprompted, while the student is quietly working. Say ONE short, natural, in-the-moment thing a real study partner would say right now — react to the specific problem/parts in context, don\'t greet, don\'t recap your rules. One or two sentences max.)');
    if(res && res.text) return res.text;
  }
  return AMBIENT[Math.floor(Math.random()*AMBIENT.length)].replace('{n}', String(state.focus+1));
}
let ambientTimer=null;
function vegaScheduleAmbient(){
  clearTimeout(ambientTimer);
  if(!state.running || !compCfg.enabled) return;
  ambientTimer = setTimeout(async ()=>{
    if(state.running && compCfg.enabled){
      const msg = await ambientLine();
      if(state.running && compCfg.enabled) vegaPop(msg, true);
    }
    vegaScheduleAmbient();
  }, (3 + Math.random()*5)*60000);
}

let vegaGreetedOnOpen = false;
vegaEl.btn.onclick = ()=>{
  if(vegaEl.bubble.classList.contains('open')){ vegaEl.bubble.classList.remove('open'); return; }
  if(!compCfg.enabled){
    addMsg('I’m switched off right now 😴 Flip the toggle above and we’ll study together.','vega');
    vegaEl.bubble.classList.add('open'); return;
  }
  if(!vegaGreetedOnOpen){ addMsg('Yo 👋 What are we cracking on?','vega'); vegaGreetedOnOpen = true; }
  vegaEl.bubble.classList.add('open');
};
document.getElementById('vegaClose').onclick = ()=> vegaEl.bubble.classList.remove('open');
vegaEl.switchEl.onchange = function(){
  compCfg.enabled = this.checked;
  store.set('practice.companion.v1', compCfg);
  vegaEl.btn.classList.toggle('off', !this.checked);
  vegaEl.quick.style.display = this.checked ? '' : 'none';
  vegaEl.input.style.display = this.checked ? '' : 'none';
  if(this.checked) addMsg('Back on duty ✨ Let’s work.','vega');
};
vegaEl.quick.style.display = compCfg.enabled ? '' : 'none';
vegaEl.input.style.display = compCfg.enabled ? '' : 'none';

/* Quick-action buttons now route through Gemini too, with canned fallback */
async function vegaQuickAsk(kind){
  if(!compCfg.enabled) return;
  vegaEl.bubble.classList.add('open');
  const prompts = {
    plan:   'Can you help me plan an approach to this question?',
    hint:   'I could use a hint on this question.',
    split:  'Want to split this question and work on it together?',
    answer: 'Just tell me the final answer.'
  };
  const fallbacks = {
    plan:   ()=>makePlan(state.focus),
    hint:   ()=> giveHint(state.focus, true) || `Let's back up. ${state.qs[state.focus] ? state.qs[state.focus].hints[0] : 'Write down the givens.'}`,
    split:  ()=>splitIt(),
    answer: ()=>peerRefuse()
  };
  await vegaRespond(prompts[kind], fallbacks[kind]);
}
document.getElementById('qvPlan').onclick   = ()=> vegaQuickAsk('plan');
document.getElementById('qvHint').onclick   = ()=> vegaQuickAsk('hint');
document.getElementById('qvSplit').onclick  = ()=> vegaQuickAsk('split');
document.getElementById('qvAnswer').onclick = ()=> vegaQuickAsk('answer');
document.getElementById('vegaSend').onclick = sendToVega;
vegaEl.text.addEventListener('keydown', e=>{ if(e.key==='Enter') sendToVega(); });

/* ---------------- selection UI ---------------- */
document.querySelectorAll('[data-olymp]').forEach(el=>{
  el.onclick = ()=>{
    document.querySelectorAll('[data-olymp]').forEach(x=>x.classList.remove('sel'));
    el.classList.add('sel');
    state.olymp = el.dataset.olymp;
    if (state.olymp === 'ipho-pyq') {
      document.getElementById('diffRow').style.display = 'none';
      document.getElementById('archiveBrowser').style.display = 'block';
      renderPyqArchive();
    } else {
      document.getElementById('diffRow').style.display = 'grid';
      document.getElementById('archiveBrowser').style.display = 'none';
      buildDiffRow();
    }
    refreshStatsChips();
  };
});

function buildDiffRow(){
  const row = document.getElementById('diffRow'); row.innerHTML='';
  if(!state.olymp || state.olymp === 'ipho-pyq') return;
  DIFFS.forEach(d=>{
    const pool = BANK[state.olymp][d.key];
    const solvedN = pool.filter(q=>solved[q.id]==='win').length;
    const s = (stats[state.olymp]||{})[d.key]||{n:0};
    const inf = (d.key==='easy' || d.key==='medium') ? ' · ∞ auto-gen' : '';
    const el = document.createElement('div');
    el.className = 'pick diff-'+d.key;
    el.innerHTML = '<h3><svg viewBox="0 0 24 24"><use href="#i-'+d.icon+'"/></svg>'+d.label+'</h3><p>'+d.desc+'</p>'
      + '<span class="chip"><svg viewBox="0 0 24 24" width="11" height="11"><use href="#i-clock"/></svg><span class="time">'+fmtShort(d.secs)+'</span></span>'
      + '<div class="stat">'+solvedN+'/'+pool.length+' solved'+inf+' · '+s.n+' attempts</div>';
    el.onclick = ()=> startSession(d.key);
    row.appendChild(el);
  });
}
function refreshStatsChips(){
  const sum = o => DIFFS.reduce((t,d)=> t + (((stats[o]||{})[d.key]||{}).n||0), 0);
  document.getElementById('chipIoaa').textContent = sum('ioaa')+' attempts';
  document.getElementById('chipIpho').textContent = sum('ipho')+' attempts';
  const pyqSolved = Object.values(attemptHistory).filter(h => h.solved).length;
  document.getElementById('chipPyq').textContent = pyqSolved + '/' + ARCHIVE.length + ' solved';
}

/* ---------------- archive browser ---------------- */
function renderPyqArchive() {
  const search  = document.getElementById('pyqSearch').value.toLowerCase().trim();
  const subject = document.getElementById('pyqSubject').value;
  const year    = document.getElementById('pyqYear').value;
  const type    = document.getElementById('pyqType').value;
  const topic   = document.getElementById('pyqTopic').value;

  const filtered = ARCHIVE.filter(p => {
    if (subject && p.subject !== subject) return false;
    if (year && p.year !== parseInt(year, 10)) return false;
    if (type && p.type !== type) return false;
    if (topic && p.topic !== topic) return false;
    if (search) {
      const hay = (p.title + ' ' + p.country + ' ' + (p.city||'') + ' ' + p.topic + ' ' + p.year + ' ' + p.label).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const list = document.getElementById('pyqList');
  document.getElementById('pyqCount').textContent =
    filtered.length + (filtered.length === 1 ? ' paper' : ' papers');
  list.innerHTML = '';

  if (!filtered.length) {
    list.innerHTML = '<div class="archive-empty">Nothing matches those filters. Try widening the search.</div>';
    return;
  }

  const CAP = 60;
  const frag = document.createDocumentFragment();
  filtered.slice(0, CAP).forEach(p => {
    const hist = attemptHistory[p.id] || {};
    const status = hist.solved
      ? '<span class="solvedchip">Solved</span>'
      : (hist.attempts > 0 ? '<span class="pyq-tag">' + hist.attempts + ' attempt' + (hist.attempts>1?'s':'') + '</span>' : '');
    const div = document.createElement('div');
    div.className = 'pyq-card';
    div.innerHTML =
      '<div class="pyq-head"><div>' +
        '<div class="pyq-title">' + p.year + ' · ' + esc(p.country) +
          ' <span class="pyq-num">' + (p.type === 'theory' ? 'T' : p.type === 'data-analysis' ? 'D' : 'E') + p.number + '</span></div>' +
        '<div class="pyq-sub">' + esc(p.title) + '</div>' +
      '</div><span class="pyq-badge ' + p.subject + '">' + (p.subject === 'ioaa' ? 'IOAA' : 'IPhO') + '</span></div>' +
      '<div class="pyq-meta">' +
        '<span class="pyq-tag">' + esc(p.type.replace('-', ' ')) + '</span>' +
        '<span class="pyq-tag">' + esc(TOPIC_LABEL[p.topic] || p.topic) + '</span>' +
        status +
      '</div>' +
      '<div class="pyq-actions">' +
        '<button class="gold" data-start="' + p.id + '">Start timed attempt</button>' +
        '<button data-open="' + p.problemUrl + '">Open problem</button>' +
        '<button data-open="' + p.solutionUrl + '">Solution</button>' +
      '</div>';
    frag.appendChild(div);
  });
  list.appendChild(frag);

  if (filtered.length > CAP) {
    const more = document.createElement('div');
    more.className = 'archive-empty';
    more.textContent = 'Showing the first ' + CAP + ' of ' + filtered.length + ' — narrow the filters to see the rest.';
    list.appendChild(more);
  }
}

document.getElementById('pyqList').addEventListener('click', e => {
  const s = e.target.closest('[data-start]');
  if (s) { startPyqSessionById(s.dataset.start); return; }
  const o = e.target.closest('[data-open]');
  if (o) window.open(o.dataset.open, '_blank', 'noopener');
});

['pyqSearch','pyqSubject','pyqYear','pyqType','pyqTopic'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', renderPyqArchive);
  el.addEventListener('change', renderPyqArchive);
});

/* populate the filter dropdowns from the data itself */
(function () {
  const ySel = document.getElementById('pyqYear');
  [...new Set(ARCHIVE.map(p => p.year))].sort((a,b) => b-a).forEach(y => {
    const o = document.createElement('option'); o.value = y; o.textContent = y; ySel.appendChild(o);
  });
  const tSel = document.getElementById('pyqTopic');
  [...new Set(ARCHIVE.map(p => p.topic))]
    .sort((a,b) => (TOPIC_LABEL[a]||a).localeCompare(TOPIC_LABEL[b]||b))
    .forEach(t => {
      const o = document.createElement('option'); o.value = t;
      o.textContent = TOPIC_LABEL[t] || t; tSel.appendChild(o);
    });
})();

function startPyqSessionById(id) {
  if (state.timer) clearInterval(state.timer);

  const primary = ARCHIVE.find(p => p.id === id);
  if (!primary) return;

  /* pair it with another unsolved problem on the same topic, same olympiad */
  const solvedIds = Object.keys(attemptHistory).filter(k => attemptHistory[k].solved);
  const pool = ARCHIVE.filter(p => p.topic === primary.topic && p.subject === primary.subject && p.id !== primary.id);
  const unsolved = pool.filter(p => !solvedIds.includes(p.id));
  const bag = unsolved.length ? unsolved : pool;
  const secondary = bag.length ? bag[Math.floor(Math.random() * bag.length)] : null;
  const chosen = secondary ? [primary, secondary] : [primary];

  const adapted = chosen.map(p => {
    const hints = (TOPIC_HINTS[p.topic] || ['Write down every given quantity with its units first.'])
      .concat(['Break it into the smallest physical model that still answers the question.']);
    return {
      id: p.id,
      topic: (TOPIC_LABEL[p.topic] || p.topic).toUpperCase(),
      q: '<div class="pyq-open">' +
           '<div><strong>' + esc(p.label) + ' · ' + esc(p.country) + (p.city ? ', ' + esc(p.city) : '') + '</strong>' +
           '<div class="pyq-open-title">' + esc(p.title) + '</div></div>' +
           '<a class="btn btn-filled" href="' + p.problemUrl + '" target="_blank" rel="noopener">Open the paper</a>' +
         '</div>' +
         '<p class="pyq-note">Work it from the official PDF — statements and figures live there. The clock and your attempt record live here.</p>',
      parts: [
        'Read the whole problem before writing anything, and note every given quantity with units.',
        'Work it under exam conditions: no solution, no calculator shortcuts you could not justify.',
        'State your assumptions explicitly where the problem leaves room for them.',
        'When the clock stops, compare against the official solution and note exactly which step broke.'
      ],
      hints: hints,
      sol: 'Official marking scheme and worked solution:<br><br>' +
           '<a href="' + p.solutionUrl + '" target="_blank" rel="noopener" class="srclink">Open the official solution</a><br>' +
           '<a href="' + p.problemUrl + '" target="_blank" rel="noopener" class="srclink">Re-open the problem</a>',
      src: p.problemUrl,
      srcName: p.label + ' official',
      isPyq: true, pyqData: p
    };
  });

  state.olymp = primary.subject; state.diff = 'archive'; state.qs = adapted;
  state.hintStage = {}; state.focus = 0;
  state.total = state.remaining = 90 * 60;
  state.running = true; state.isPyq = true;

  document.getElementById('tagOlymp').textContent = primary.label;
  document.getElementById('tagDiff').textContent = 'Past paper · 90 min';
  document.getElementById('scratch').value = '';
  document.getElementById('hintLog').innerHTML = '';
  document.getElementById('btnPause').textContent = 'Pause';
  renderQuestions();
  document.getElementById('review').classList.remove('open');
  document.getElementById('arena').classList.add('open');
  document.getElementById('archiveBrowser').style.display = 'none';
  document.getElementById('arena').scrollIntoView({behavior:'smooth'});

  tick();
  state.timer = setInterval(tick, 1000);
  if (compCfg.enabled) vegaPop('Loaded ' + primary.label + ' — ' + primary.title +
    '. Open the PDF and we work it together. I will not hand you the answer, but I will help you unstick. 🤝', true);
  vegaScheduleAmbient();
}

/* ---------------- session logic ---------------- */
function pickQuestions(){
  const pool = BANK[state.olymp][state.diff] || [];
  seen[state.olymp] = seen[state.olymp] || {};
  const used = seen[state.olymp][state.diff] = seen[state.olymp][state.diff] || [];

  /* Prefer authored problems you have not seen. Once those run out, keep
     generating fresh parameterised ones rather than silently re-serving
     the same pair forever. */
  const fresh = pool.filter(q => !used.includes(q.id));
  for (let i = fresh.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
  }
  const drawn = fresh.slice(0, 2);

  let guard = 0;
  while (drawn.length < 2 && guard++ < 8) {
    const g = genQuestion(state.olymp, state.diff);
    if (!g) break;
    if (drawn.some(q => q.topic === g.topic)) continue;   // avoid a same-topic pair
    drawn.push(g);
  }
  while (drawn.length < 2) {                              // no generator for this pool
    const g = genQuestion(state.olymp, state.diff);
    if (g) { drawn.push(g); continue; }
    const recycled = pool.filter(q => !drawn.includes(q));
    if (!recycled.length) break;
    used.length = 0;
    drawn.push(recycled[Math.floor(Math.random() * recycled.length)]);
  }

  drawn.forEach(q => { if (!q.gen && !used.includes(q.id)) used.push(q.id); });
  store.set('practice.seen.v1', seen);
  return drawn;
}

function renderQuestions(){
  const holder = document.getElementById('qList'); holder.innerHTML='';
  state.qs.forEach((q,i)=>{
    const sec = document.createElement('div'); sec.className='qblock';
    const chip = (solved[q.id]==='win' || (attemptHistory[q.id] && attemptHistory[q.id].solved)) ? '<span class="solvedchip">Solved before</span>' : '';
    sec.innerHTML = '<div class="qhead"><span class="qnum">Q'+(i+1)+'</span>'
      +'<span class="qtopic">'+q.topic+'</span>'
      +'<a class="srclink" href="'+q.src+'" target="_blank" rel="noopener" title="Source: '+q.srcName+'"><svg viewBox="0 0 24 24" width="14" height="14"><use href="#i-external"/></svg></a>'
      +chip
      +'<button class="hintbtn" data-i="'+i+'">Hint for Q'+(i+1)+'</button></div>'
      +'<p class="qtext">'+q.q+'</p>';
    const ol = document.createElement('ol'); ol.className='parts';
    q.parts.forEach(p=>{ const li=document.createElement('li'); li.textContent=p; ol.appendChild(li); });
    sec.appendChild(ol);
    holder.appendChild(sec);
  });
  renderMathIn(holder);
}
document.getElementById('qList').addEventListener('click', e=>{
  const b = e.target.closest('.hintbtn'); if(!b) return;
  state.focus = +b.dataset.i;
  const msg = giveHint(state.focus, false);
  if(msg && compCfg.enabled){ addMsg(msg,'vega'); }
});

function giveHint(qi, viaChat){
  const q = state.qs[qi];
  if(!q) return 'Start a session first — then hints flow freely 🙂';
  state.hintStage[q.id] = state.hintStage[q.id]||0;
  if(state.hintStage[q.id] >= q.hints.length)
    return 'That’s every nudge I’ve got for Q'+(qi+1)+' 😅 Trust your setup — you’re closer than you think.';
  const h = q.hints[state.hintStage[q.id]++];
  const label = 'Vega on Q'+(qi+1)+' · hint '+state.hintStage[q.id]+'/'+q.hints.length;
  const div = document.createElement('div');
  div.className='hint'; div.innerHTML='<b>'+label+'</b><br>'+h;
  document.getElementById('hintLog').appendChild(div);
  renderMathIn(div);
  return viaChat ? `Okay, here’s what I’d whisper to myself on Q${qi+1}: ${h}` : null;
}

function startSession(diffKey){
  // FIX: Clear any existing timer to prevent stopwatch from running too fast
  if (state.timer) clearInterval(state.timer);

  const d = DIFFS.find(x=>x.key===diffKey);
  state.diff = diffKey;
  state.qs = pickQuestions();
  state.hintStage = {};
  state.focus = 0;
  state.total = state.remaining = d.secs;
  state.running = true;
  state.isPyq = false;

  document.getElementById('tagOlymp').textContent = OLYM_LABEL[state.olymp];
  document.getElementById('tagDiff').textContent = d.label.toUpperCase()+' · '+fmtShort(d.secs);
  document.getElementById('scratch').value='';
  document.getElementById('hintLog').innerHTML='';
  document.getElementById('btnPause').textContent='Pause';
  renderQuestions();
  document.getElementById('review').classList.remove('open');
  document.getElementById('arena').classList.add('open');
  document.getElementById('arena').scrollIntoView({behavior:'smooth'});

  tick(); state.timer = setInterval(tick, 1000);
  if(compCfg.enabled){
    const preferred = state.qs[0].parts.length <= state.qs[state.qs.length-1].parts.length ? 0 : state.qs.length-1;
    state.focus = preferred;
    vegaPop(`Read both questions ✓ I’d start with Q${preferred+1} — looks friendlier. Your call though, I’ll match your pace 🤝`, true);
  }
  vegaScheduleAmbient();
}

function fmt(s){ const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60;
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0'); }
function fmtShort(s){ const h=Math.floor(s/3600), m=Math.round(s%3600/60);
  return h? h+'h'+(m?' '+m+'m':'') : m+' min'; }

let firedHalf=false, firedWarn=false;
function tick(){
  state.remaining--;
  const r = state.remaining;
  document.getElementById('clock').textContent = fmt(Math.max(0,r));
  const pct = 100*r/state.total;
  document.getElementById('tfill').style.width = Math.max(0,pct)+'%';
  document.getElementById('tbar').classList.toggle('low', pct<12);
  document.getElementById('clock').classList.toggle('warn', r<=180);

  if(!firedHalf && r<=state.total/2){ firedHalf=true;
    vegaPop('Halfway! I’ve got my part sketched out — how’s yours? Write up what you have; messy work still earns marks.', true); }
  const warnAt = state.total<=1500 ? 300 : 600;
  if(!firedWarn && r<=warnAt){ firedWarn=true;
    vegaPop('Final stretch ⏳ Secure what’s done, and set up whatever isn’t — a clean setup is worth real points.', true); }
  if(r<=0) endSession(true);
}

function endSession(timeUp){
  if(!state.running) return;
  state.running=false; clearInterval(state.timer); clearTimeout(ambientTimer);
  firedHalf=firedWarn=false;
  if(timeUp) vegaPop('Time! Pencils down 😄 Honor system — let’s see what we built.', true);

  if (state.isPyq && state.qs.length > 0) {
    state.qs.forEach(q => {
      if (q.isPyq && q.pyqData) {
        if (!attemptHistory[q.id]) {
          attemptHistory[q.id] = { attempts: 0, bestTime: Infinity, status: 'none', confidence: 0, failureModes: [], notes: '', solved: false };
        }
        attemptHistory[q.id].attempts += 1;
        attemptHistory[q.id].lastAttempt = new Date().toISOString();
        const timeTaken = state.total - state.remaining;
        if (timeTaken < attemptHistory[q.id].bestTime) attemptHistory[q.id].bestTime = timeTaken;
        store.set('practice.attempts.v1', attemptHistory);
      }
    });
  } else {
    const s = stats[state.olymp] = stats[state.olymp]||{};
    const rec = s[state.diff] = s[state.diff]||{n:0,w:0,a:0,m:0};
    rec.n++; store.set('practice.stats.v1', stats);
  }

  buildReview();
  document.getElementById('arena').classList.remove('open');
  document.getElementById('review').classList.add('open');
  document.getElementById('review').scrollIntoView({behavior:'smooth'});
  refreshStatsChips();
  if(state.olymp !== 'ipho-pyq') buildDiffRow();
}

function buildReview(){
  const box = document.getElementById('reviewBody'); box.innerHTML='';
  state.qs.forEach((q,i)=>{
    const div = document.createElement('div'); div.className='revq';
    div.innerHTML = '<h4>Q'+(i+1)+' · '+q.topic+' <a class="srclink" href="'+q.src+'" target="_blank" rel="noopener" title="Source: '+q.srcName+'"><svg viewBox="0 0 24 24" width="14" height="14"><use href="#i-external"/></svg></a></h4>'
      + '<div class="sol">'+q.sol+'</div>'
      + '<div class="grade">'
      + '<button data-q="'+q.id+'" data-g="win">✓ Solved it</button>'
      + '<button data-q="'+q.id+'" data-g="almost">◐ Partial</button>'
      + '<button data-q="'+q.id+'" data-g="miss">✗ Missed it</button>'
      + '</div>';
    box.appendChild(div);
  });
  renderMathIn(box);
}
document.getElementById('reviewBody').addEventListener('click', e=>{
  const b = e.target.closest('button[data-q]'); if(!b) return;
  const qid = b.dataset.q, g = b.dataset.g;
  const q = state.qs.find(x => x.id === qid);

  if (q && q.isPyq) {
    if (!attemptHistory[qid]) {
      attemptHistory[qid] = { attempts: 1, bestTime: state.total - state.remaining, status: 'none', confidence: 0, failureModes: [], notes: '', solved: false };
    }
    attemptHistory[qid].status = g;
    if (g === 'win') attemptHistory[qid].solved = true;
    store.set('practice.attempts.v1', attemptHistory);
  } else {
    solved[qid] = g; store.set('practice.solved.v1', solved);
    const rec = stats[state.olymp][state.diff];
    if(g==='win') rec.w++; else if(g==='almost') rec.a=(rec.a||0)+1; else rec.m=(rec.m||0)+1;
    store.set('practice.stats.v1', stats);
  }

  b.parentElement.querySelectorAll('button').forEach(x=>x.style.opacity=.4);
  b.style.opacity=1;
  if(compCfg.enabled) addMsg(g==='win'
    ? 'Yes!! 🎉 We got that one. Log it, own it — next pair, slightly scarier?'
    : g==='almost'
    ? 'Almost counts. Note exactly which step broke — that’s our next rep together.'
    : 'Good. Now we know the gap. Read the sketch, then let’s hit a fresh pair — repetition is how this is learned 💪','vega');
  refreshStatsChips();
});

/* ---------------- controls ---------------- */
document.getElementById('btnEnd').onclick = ()=> endSession(false);
document.getElementById('btnPause').onclick = function(){
  if(!state.qs.length) return;
  if(state.running){
    state.running=false; clearInterval(state.timer); clearTimeout(ambientTimer); this.textContent='Resume';
  } else {
    state.running=true; state.timer=setInterval(tick,1000); this.textContent='Pause'; vegaScheduleAmbient();
  }
};
document.getElementById('btnNext').onclick = ()=> {
  if (state.isPyq) {
    document.getElementById('review').classList.remove('open');
    document.getElementById('archiveBrowser').style.display = 'block';
    renderPyqArchive();
  } else {
    startSession(state.diff);
  }
};
document.getElementById('btnBack').onclick = ()=>{
  document.getElementById('review').classList.remove('open');
  if (state.olymp === 'ipho-pyq') {
    document.getElementById('archiveBrowser').style.display = 'block';
  } else {
    window.scrollTo({top:0, behavior:'smooth'});
  }
};

/* ---------------- init ---------------- */
(function init(){
  const h = (location.hash||'').toLowerCase();
  if(h.includes('ipho')) document.querySelector('[data-olymp="ipho"]').click();
  else if(h.includes('ioaa')) document.querySelector('[data-olymp="ioaa"]').click();
  refreshStatsChips();
  if(compCfg.enabled) setTimeout(()=>vegaPop('Hey, it’s Vega ✨ Your study partner. We plan problems together, I give hints not answers, and we do this like a two-person training camp. Deal?', true), 3500);
})();
