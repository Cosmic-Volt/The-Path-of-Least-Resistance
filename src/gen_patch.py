#!/usr/bin/env python3
"""Add hard + olympiad auto-generators so those pools never run dry."""
import pathlib
p = pathlib.Path(__file__).parent / 'practice-core.js'
s = p.read_text()

IOAA_EXTRA = """    hard: [
      ()=>{ const v=pick([200,220,240]), R=pick([8,8.5,10]);
        const M=r1(v*v*R*1000/4.30e-3/1e10);
        return Q('Galactic dynamics', `The Sun orbits the Galactic centre at v = ${v} km/s at R\\u2080 = ${R} kpc. (G = 4.30\\u00d710\\u207b\\u00b3 pc (km/s)\\u00b2/M\\u2609)`,
          ['Mass enclosed within R\\u2080?','If visible matter inside R\\u2080 is 6\\u00d710\\u00b9\\u2070 M\\u2609, what fraction is dark?','Why does a flat rotation curve imply M(<r) \\u221d r?'],
          ['Circular orbit: v\\u00b2 = GM/R.','Convert kpc to pc before dividing.','If v is constant, rearrange v\\u00b2 = GM(r)/r for M(r).'],
          `M = v\\u00b2R/G = ${M}\\u00d710\\u00b9\\u2070 M\\u2609; dark fraction \\u2248 ${r1((M-6)/M*100)}%.`); },
      ()=>{ const z=pick([0.01,0.015,0.02,0.05]), H=pick([67,70,73]);
        const d=r1(z*3e5/H);
        return Q('Cosmology', `A galaxy is observed at redshift z = ${z}. Take H\\u2080 = ${H} km/s/Mpc.`,
          ['Recession velocity?','Distance?','Lookback time in Myr?'],
          ['Small z: v \\u2248 zc.','d = v/H\\u2080.','t \\u2248 d/c \\u2014 1 Mpc \\u2248 3.26 Mly.'],
          `v = ${Math.round(z*3e5)} km/s; d = ${d} Mpc; lookback \\u2248 ${Math.round(d*3.26)} Myr.`); },
      ()=>{ const depth=pick([0.5,1,2]), P=pick([2.5,3.5,5]);
        const rp=r1(Math.sqrt(depth/100)*100)/100, a=r1(Math.pow(P/365.25,2/3)*1000)/1000;
        return Q('Transits', `A Sun-like star shows transits of depth ${depth}% repeating every ${P} days.`,
          ['Planet radius in R\\u2609?','Semi-major axis in AU?','Rough central-transit duration in hours?'],
          ['Depth = (Rp/R\\u2605)\\u00b2.','Kepler III with M = 1 M\\u2609.','Duration \\u2248 P\\u00b7R\\u2605/(\\u03c0a).'],
          `Rp = ${rp} R\\u2609; a = ${a} AU; duration \\u2248 ${r1(P*24/Math.PI/(a*215))} h.`); }
    ],
    olympiad: [
      ()=>{ const T=pick([5500,5800,6100]), K=pick([90,140,190]), P=pick([3,4,5]), depth=pick([0.8,1,1.4]);
        const a=r1(Math.pow(P/365.25,2/3)*1000)/1000;
        return Q('Exoplanet characterisation', `A survey finds transits of a 1 M\\u2609, 1 R\\u2609, ${T} K star. Period P = ${P}.0 days, transit depth ${depth}%, orbit edge-on. Radial velocities give semi-amplitude K = ${K} m/s.`,
          ['Planet radius in R_J?','Planet mass in M_J? (K \\u2248 28.4 m/s \\u00b7(Mp/M_J)\\u00b7(P/1yr)^(\\u22121/3)\\u00b7(M\\u2605/M\\u2609)^(\\u22122/3))','Semi-major axis?','Equilibrium temperature for Bond albedo 0.3? (Teq = T\\u2605\\u221a(R\\u2605/2a)(1\\u2212A)^\\u00bc)','Mean density \\u2014 what kind of planet is this?'],
          ['The transit depth is a pure ratio. Start there.','Convert the period to years before taking the \\u22121/3 power.','Teq is solar-heating geometry with a dilution factor.','Compare your density with Jupiter (1.3 g/cm\\u00b3).'],
          `Rp \\u2248 ${r1(Math.sqrt(depth/100)*9.95)} R_J; Mp \\u2248 ${r1(K/28.4*Math.pow(P/365.25,1/3))} M_J; a \\u2248 ${a} AU; Teq \\u2248 ${Math.round(T*Math.sqrt(1/(2*a*215))*Math.pow(0.7,0.25))} K \\u2014 a hot Jupiter.`); },
      ()=>{ const m=pick([12.4,12.7,13.2]), z=pick([0.006,0.008,0.011]);
        const d=Math.round(Math.pow(10,(m+19.3+5)/5)/1e6);
        return Q('Standard candles', `A Type Ia supernova peaks at m = +${m} in a galaxy at redshift z = ${z}. Assume M = \\u221219.3 for a normal SN Ia.`,
          ['Luminosity distance to the host?','Estimate H\\u2080 from this one object.','This SN has a broad, slow light curve \\u2014 intrinsically brighter or fainter, and which way does the distance move?','Why "standardizable" rather than "standard" candles?'],
          ['Distance modulus first: m \\u2212 M = 5log\\u2081\\u2080(d/10 pc).','v \\u2248 zc, then H\\u2080 = v/d \\u2014 mind the units.','Think nickel mass and diffusion time.'],
          `d \\u2248 ${d} Mpc; v = ${Math.round(z*3e5)} km/s \\u2192 H\\u2080 \\u2248 ${Math.round(z*3e5/d)} km/s/Mpc from one noisy object. Broader light curve \\u21d2 brighter \\u21d2 true distance larger. The width\\u2013luminosity relation is what makes them standardizable.`); }
    ],
"""

IPHO_EXTRA = """    hard: [
      ()=>{ const B=pick([0.4,0.6,0.8]), L=pick([0.2,0.4,0.5]), R=pick([2,5,10]), m=pick([0.01,0.02,0.05]);
        return Q('Electromagnetic induction', `A conducting rod of mass ${m} kg and length ${L} m slides without friction down two vertical rails joined at the bottom by R = ${R} \\u03a9. A uniform field B = ${B} T points out of the page. Take g = 9.8 m/s\\u00b2.`,
          ['Direction of the induced current through the rod?','Terminal velocity?','Verify it with an energy argument.'],
          ['Flux through the loop is increasing \\u2014 Lenz decides the direction.','Terminal: BIL = mg with I = BLv/R.','Compare mgv with I\\u00b2R.'],
          `The current opposes the flux increase. v_term = mgR/(B\\u00b2L\\u00b2) = ${r1(m*9.8*R/(B*B*L*L))} m/s, and at that speed mgv = (BLv)\\u00b2/R exactly.`); },
      ()=>{ const th=pick([20,30,40]);
        return Q('Rolling motion', `A solid cylinder (I = \\u00bdmr\\u00b2) rolls without slipping down an incline of ${th}\\u00b0. Take g = 9.8 m/s\\u00b2.`,
          ['Acceleration?','Minimum coefficient of friction?','How does the descent time compare with a frictionless sliding block?'],
          ['Torque about the centre: f\\u00b7r = I\\u03b1, and rolling gives a = \\u03b1r.','a_cyl = (2/3)g sin\\u03b8 versus g sin\\u03b8 for sliding.'],
          `a = (2/3)g sin${th}\\u00b0 = ${r1(2/3*9.8*Math.sin(th*Math.PI/180))} m/s\\u00b2; \\u03bc \\u2265 (1/3)tan${th}\\u00b0 = ${r1(Math.tan(th*Math.PI/180)/3)}; rolling takes \\u221a(3/2) \\u2248 1.22\\u00d7 longer.`); },
      ()=>{ const C=pick([100,220,470]), R=pick([10,22,47]), V=pick([5,9,12]);
        const tau=r1(R*C/1000);
        return Q('RC transients', `An uncharged C = ${C} \\u00b5F capacitor is charged through R = ${R} k\\u03a9 from a ${V} V source.`,
          ['Time constant?','Charge after one time constant?','Total energy the source delivers versus the energy stored \\u2014 where does the difference go, and does it depend on R?'],
          ['q(t) = CV(1 \\u2212 e^(\\u2212t/RC)).','e\\u207b\\u00b9 \\u2248 0.37.','Integrate the power dissipated in R over all time.'],
          `\\u03c4 = RC = ${tau} s; q(\\u03c4) \\u2248 ${Math.round(0.63*C*V)} \\u00b5C. The source delivers CV\\u00b2 = ${r1(C*V*V/1000)} mJ, the capacitor keeps \\u00bdCV\\u00b2 = ${r1(C*V*V/2000)} mJ \\u2014 exactly half is dissipated in R, independent of R.`); }
    ],
    olympiad: [
      ()=>{ const h=pick([1.2,1.8,2.5]), mu=pick([0.2,0.3,0.4]), d=pick([1,1.5,2]), M=pick([1,2,3]), k=pick([200,400,800]);
        const v1=r1(Math.sqrt(2*9.8*h)), v2=r1(Math.sqrt(Math.max(0,2*9.8*h-2*mu*9.8*d)));
        return Q('Mechanics gauntlet', `A block of mass m is released from rest at height ${h} m on a frictionless quarter-circle ramp. At the bottom it crosses a rough patch of length ${d} m (\\u03bc = ${mu}), then collides with and sticks to a stationary block of mass M = ${M}m attached to a spring (k = ${k} N/m) on a frictionless surface. Take g = 9.8 m/s\\u00b2.`,
          ['Speed just before the rough patch?','Speed after crossing it?','Speed of the combined mass right after the collision?','Maximum spring compression, in terms of m?','Condition on \\u03bc for the block to stop before reaching M?'],
          ['The ramp is pure energy conservation.','Rough patch: friction does \\u2212\\u03bcmgd of work.','The collision conserves momentum, not kinetic energy.','After sticking: \\u00bd(1+${M})mv\\u00b2 \\u2194 \\u00bdkx\\u00b2.','Compare the friction work available with mgh.'],
          `v\\u2081 = \\u221a(2gh) = ${v1} m/s; v\\u2082 = ${v2} m/s; v\\u2083 = v\\u2082/${1+M} = ${r1(v2/(1+M))} m/s; x = v\\u2083\\u221a((1+${M})m/${k}). It stops short when \\u03bc \\u2265 h/d = ${r1(h/d)}.`); },
      ()=>{ const V=pick([500,1000,2000]), E=pick([10000,20000]), B=pick([0.01,0.02]);
        return Q('Crossed fields', `A particle of charge q and mass m is accelerated from rest through ${V} V, enters a velocity selector with perpendicular fields E = ${E} V/m and B = ${B} T, then enters a region with B\\u2080 only, tracing a semicircle to a detector.`,
          ['Speed after acceleration?','Relation between E, B and v to pass undeflected?','Radius of the semicircle in terms of E, B, B\\u2080, q and m?','Time spent in the B\\u2080 region?','If B in the selector is doubled with E fixed, which way does it deflect?'],
          ['Energy: qV = \\u00bdmv\\u00b2.','Selector balance: electric force = magnetic force.','Chain it: v from the selector, then r = mv/(qB\\u2080).','A semicircle is half a cyclotron period.'],
          `v = \\u221a(2qV/m); the selector passes v = E/B = ${r1(E/B/1e5)}\\u00d710\\u2075 m/s; r = mE/(qBB\\u2080); t = \\u03c0m/(qB\\u2080), independent of v. Doubling B makes qvB > qE, so it deflects toward the magnetic-force side.`); }
    ],
"""

anchor_ioaa = "    medium: [\n      ()=>{ const [a,P]=pick([[8,8],[16,16],[20,10],[8,4],[16,8]]), d=pick([5,10,20]);"
anchor_ipho = "  ipho: {\n    easy: [\n      ()=>{ const v=pick([10,15,20,25,30]);"

assert anchor_ioaa in s, "IOAA anchor missing"
assert anchor_ipho in s, "IPhO anchor missing"

s = s.replace(anchor_ioaa, IOAA_EXTRA + anchor_ioaa, 1)
s = s.replace(anchor_ipho, "  ipho: {\n" + IPHO_EXTRA + "    easy: [\n      ()=>{ const v=pick([10,15,20,25,30]);", 1)

p.write_text(s)
print("patched")
