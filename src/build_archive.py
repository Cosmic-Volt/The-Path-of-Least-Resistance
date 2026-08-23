#!/usr/bin/env python3
"""Merge the researched IOAA + IPhO indexes into one archive data file."""
import json, pathlib
HERE = pathlib.Path(__file__).parent

ioaa = json.load(open(HERE / 'ioaa_index.json'))

IPHO_EDITIONS = {
 2025:("France","Paris"), 2024:("Iran","Isfahan"), 2023:("Japan","Tokyo"),
 2022:("Switzerland","remote"), 2021:("Lithuania","Vilnius (remote)"),
 2020:("IdPhO · MIPT Russia","distributed"), 2019:("Israel","Tel Aviv"),
 2018:("Portugal","Lisbon"), 2017:("Indonesia","Yogyakarta"),
 2016:("Switzerland & Liechtenstein","Zurich"), 2015:("India","Mumbai"),
 2014:("Kazakhstan","Astana"), 2013:("Denmark","Copenhagen"),
 2012:("Estonia","Tallinn & Tartu"), 2011:("Thailand","Bangkok"),
 2010:("Croatia","Zagreb"),
}
# (year, file-index 1..5, type, per-section number, title, topic)
IPHO_RAW = [
 (2025,1,'theory',1,"Hydrogen and galaxies","astro"),
 (2025,2,'theory',2,"Cox's timepiece","mechanics"),
 (2025,3,'theory',3,"Champagne","thermodynamics"),
 (2025,4,'experimental',1,"Earth's magnetic field","experimental"),
 (2025,5,'experimental',2,"Sand craters and dunes","experimental"),
 (2025,6,'theory',4,"Strongly correlated Fermi gases (backup)","modern"),
 (2024,1,'theory',1,"The greenhouse effect","thermodynamics"),
 (2024,2,'theory',2,"Trapping ions and cooling atoms","modern"),
 (2024,3,'theory',3,"Black widow pulsar","astro"),
 (2024,4,'experimental',1,"Heat conduction in a copper rod","experimental"),
 (2024,5,'experimental',2,"Diffraction from phase steps","experimental"),
 (2023,1,'theory',1,"Characterization of soil colloids","electromagnetism"),
 (2023,2,'theory',2,"Neutron stars","astro"),
 (2023,3,'theory',3,"Water and objects","mechanics"),
 (2023,4,'experimental',1,"Mass measurement","experimental"),
 (2023,5,'experimental',2,"Thickness via birefringence","experimental"),
 (2022,1,'theory',1,"Permanent magnets","electromagnetism"),
 (2022,2,'theory',2,"James Webb Space Telescope","astro"),
 (2022,3,'theory',3,"Scaling laws","mechanics"),
 (2022,4,'experimental',1,"Planet","experimental"),
 (2022,5,'experimental',2,"Cylindrical diode","experimental"),
 (2021,1,'theory',1,"Planetary physics","astro"),
 (2021,2,'theory',2,"Electrostatic lens","electromagnetism"),
 (2021,3,'theory',3,"Particles and waves","modern"),
 (2021,4,'experimental',1,"Non-ideal capacitors","experimental"),
 (2021,5,'experimental',2,"Light emitting diodes","experimental"),
 (2020,1,'theory',1,"Problem mix","electromagnetism"),
 (2020,2,'theory',2,"Anisotropic friction","mechanics"),
 (2020,3,'theory',3,"Laser technologies","modern"),
 (2020,4,'experimental',1,"Crystallography","experimental"),
 (2019,1,'theory',1,"Zero-length springs and slinky coils","mechanics"),
 (2019,2,'theory',2,"The physics of a microwave oven","electromagnetism"),
 (2019,3,'theory',3,"Thermoacoustic engine","thermodynamics"),
 (2019,4,'experimental',1,"Optical measurements","experimental"),
 (2019,5,'experimental',2,"Wiedemann–Franz law","experimental"),
 (2018,1,'theory',1,"LIGO-GW150914","relativity"),
 (2018,2,'theory',2,"Where is the neutrino?","modern"),
 (2018,3,'theory',3,"Physics of live systems","thermodynamics"),
 (2018,4,'experimental',1,"Paper transistor","experimental"),
 (2018,5,'experimental',2,"Viscoelasticity of a polymer thread","experimental"),
 (2017,1,'theory',1,"Dark matter","astro"),
 (2017,2,'theory',2,"Earthquake, volcano and tsunami","waves"),
 (2017,3,'theory',3,"Cosmic inflation","astro"),
 (2017,4,'experimental',1,"Optics of a salt solution","experimental"),
 (2017,5,'experimental',2,"Earthquake and volcano sensing","experimental"),
 (2016,1,'theory',1,"Two problems in mechanics","mechanics"),
 (2016,2,'theory',2,"Nonlinear dynamics in electric circuits","electromagnetism"),
 (2016,3,'theory',3,"Large Hadron Collider","relativity"),
 (2016,4,'experimental',1,"Electrical conductivity in two dimensions","experimental"),
 (2016,5,'experimental',2,"Jumping beads","experimental"),
 (2015,1,'theory',1,"Particles from the Sun","astro"),
 (2015,2,'theory',2,"The extremum principle","optics"),
 (2015,3,'theory',3,"The design of a nuclear reactor","modern"),
 (2015,4,'experimental',1,"Diffraction due to helical structure","experimental"),
 (2015,5,'experimental',2,"Diffraction due to surface tension waves","experimental"),
 (2014,1,'theory',1,"Three problems (mixed)","mechanics"),
 (2014,2,'theory',2,"Van der Waals equation of state","thermodynamics"),
 (2014,3,'theory',3,"Simplest model of gas discharge","electromagnetism"),
 (2014,4,'experimental',1,"To see invisible!","experimental"),
 (2013,1,'theory',1,"The Maribo meteorite","astro"),
 (2013,2,'theory',2,"Plasmonic steam generator","thermodynamics"),
 (2013,3,'theory',3,"The Greenlandic ice sheet","thermodynamics"),
 (2013,4,'experimental',1,"Speed of light","experimental"),
 (2013,5,'experimental',2,"Solar cells","experimental"),
 (2012,1,'theory',1,"Focus on sketches","mechanics"),
 (2012,2,'theory',2,"Kelvin water dropper","electromagnetism"),
 (2012,3,'theory',3,"Protostar formation","astro"),
 (2012,4,'experimental',1,"Magnetic permeability of water","experimental"),
 (2012,5,'experimental',2,"Nonlinear black box","experimental"),
 (2011,1,'theory',1,"A three-body problem and LISA","astro"),
 (2011,2,'theory',2,"An electrified soap bubble","electromagnetism"),
 (2011,3,'theory',3,"Scattering of an ion by a neutral atom","mechanics"),
 (2011,4,'experimental',1,"Capacitive displacement sensor","experimental"),
 (2011,5,'experimental',2,"A cylinder with a ball inside","experimental"),
 (2010,1,'theory',1,"Image of a charge in a metallic object","electromagnetism"),
 (2010,2,'theory',2,"Chimney physics","thermodynamics"),
 (2010,3,'theory',3,"Simple model of an atomic nucleus","modern"),
 (2010,4,'experimental',1,"Elasticity of sheets","experimental"),
 (2010,5,'experimental',2,"Forces between magnets","experimental"),
]

ipho = []
for year, fidx, typ, num, title, topic in IPHO_RAW:
    c, city = IPHO_EDITIONS[year]
    ipho.append(dict(
        subject='ipho', year=year, country=c, city=city, type=typ, number=num,
        title=title, topic=topic,
        problemUrl=f"https://ipho.olimpicos.net/pdf/IPhO_{year}_Q{fidx}.pdf",
        solutionUrl=f"https://ipho.olimpicos.net/pdf/IPhO_{year}_S{fidx}.pdf",
    ))

for e in ioaa:
    e['subject'] = 'ioaa'
    e.pop('verified', None)
    e.pop('solutionUrlVerified', None)

def slim(e):
    return {k: e[k] for k in
            ('subject','year','country','city','type','number','title','topic','problemUrl','solutionUrl')
            if k in e}

archive = [slim(e) for e in ioaa] + [slim(e) for e in ipho]
archive.sort(key=lambda e: (e['subject'], -e['year'], e['type'], e['number']))

out = (HERE / 'archive.js')
out.write_text(
  "/* ============================================================================\n"
  "   Past-paper archive — verified metadata and official PDF links.\n"
  "   Problem statements and figures are NOT reproduced here; each entry links\n"
  "   out to the official paper. Sources: ioaastrophysics.org (official IOAA),\n"
  "   ioaa.olimpicos.net and ipho.olimpicos.net (per-problem mirrors).\n"
  "   ========================================================================== */\n"
  "const PAPER_ARCHIVE = " + json.dumps(archive, ensure_ascii=False, separators=(',', ':')) + ";\n")

print("archive.js written:", len(archive), "entries",
      "| IOAA", sum(1 for e in archive if e['subject']=='ioaa'),
      "| IPhO", sum(1 for e in archive if e['subject']=='ipho'))
print("bytes:", out.stat().st_size)
