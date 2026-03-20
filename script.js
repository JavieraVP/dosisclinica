/**
 * ============================================================
 * DosisClínica — script.js
 * Lógica principal de la calculadora de dosis clínica
 *
 * Organización:
 *   1. Diccionarios de etiquetas (TL, VL, VS)
 *   2. Base de datos de medicamentos (MEDS)
 *   3. Categorías y configuración del acordeón (CATS, ACC_CONFIG)
 *   4. Estado de la aplicación (variables globales)
 *   5. Inicialización
 *   6. Tipo de paciente (selectTipo)
 *   7. Acordeón del sidebar (renderSidebarNav, toggleAccordion)
 *   8. Selección de medicamento (selectMed)
 *   9. Vías de administración (renderVias, selectVia)
 *  10. Formatos farmacéuticos (renderFormatos)
 *  11. Cálculo de dosis (calcular)
 *  12. Panel de referencia (renderRefList, toggleRef, filterRef)
 *  13. Navegación por pestañas (showTab)
 *  14. Funciones helper (fN, aH)
 * ============================================================
 */


// ════════════════════════════════════════════════════════════
//  DATA
// ════════════════════════════════════════════════════════════
const TL = { jarabe:'Jarabe', comprimido:'Comprimido', gotas:'Gotas', supositorio:'Supositorio', capsula:'Cápsula', solucion:'Solución IV', suspension:'Suspensión', dispersable:'Comp. Dispersable', ampolla:'Ampolla', ui:'UI', masticable:'Masticable' };
const VL = { oral:'Oral', rectal:'Rectal', endovenosa:'Endovenosa', intramuscular:'Intramuscular' };
const VS = { oral:'Jarabe · Comp. · Gotas', rectal:'Supositorio', endovenosa:'IV · Ampollas', intramuscular:'Inyectable' };

const MEDS = {
  paracetamol:{
    cat:'analg', name:'Paracetamol', desc:'Analgésico · Antipirético',
    mech:'Inhibe COX en SNC · Dolor leve a moderado · Fiebre',
    ind:'Dolor leve a moderado. Fiebre.',
    alerts:[],
    vias:{
      oral:{ freq:'Cada 6–8 horas · Máximo 2–3 días',
        formatos:[
          {name:'Jarabe 120 mg/5ml',conc:120,per:5,resUnit:'ml',tag:'jarabe',label:'120 mg/5 ml · Kitadol, Algiafin'},
          {name:'Jarabe 160 mg/5ml',conc:160,per:5,resUnit:'ml',tag:'jarabe',label:'160 mg/5 ml · Panadol Niños'},
          {name:'Gotas 100 mg/ml',conc:100,per:1,resUnit:'gotas',gttFactor:30,tag:'gotas',label:'100 mg/ml · 30 gtt/ml · Kitadol Gotas'},
          {name:'Comp. masticable 160 mg',conc:160,per:1,resUnit:'comp',tag:'masticable',label:'160 mg · masticable · Kitadol · Infantil'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp'},
          {name:'Comprimido 1 g',conc:1000,per:1,resUnit:'comp',tag:'comprimido',label:'1000 mg/comp'},
        ],
        dosisNino:{min:10,max:15}, dosisAdulto:{fixed:true,min:500,max:1000}},
      rectal:{ freq:'Cada 6–8 horas',
        formatos:[
          {name:'Supositorio 125 mg',conc:125,per:1,resUnit:'supositorios',tag:'supositorio',label:'125 mg'},
          {name:'Supositorio 250 mg',conc:250,per:1,resUnit:'supositorios',tag:'supositorio',label:'250 mg'},
        ],
        dosisNino:{min:30,max:40}, dosisAdulto:{min:30,max:40}},
      endovenosa:{ freq:'Cada 6–8 horas · Infusión IV 15 min',
        formatos:[{name:'Solución IV 10 mg/ml',conc:10,per:1,resUnit:'ml',tag:'solucion',label:'10 mg/ml'}],
        dosisNino:{min:10,max:15}, dosisAdulto:{min:10,max:15}},
    },
    refAlerts:[{t:'info',m:'Gotas orales: 2–3 gotas/kg/dosis · cada 6–8h.'}],
    refDosis:[{via:'Oral',nino:'10–15 mg/kg/dosis',adulto:'500–1000 mg (fija)',freq:'c/6–8h · 2–3 días'},{via:'Rectal',nino:'30–40 mg/kg/dosis',adulto:'30–40 mg/kg/dosis',freq:'c/6–8h'},{via:'EV',nino:'10–15 mg/kg/dosis',adulto:'10–15 mg/kg/dosis',freq:'c/6–8h · inf. 15min'}]
  },
  ibuprofeno:{
    cat:'analg', name:'Ibuprofeno', desc:'AINE · Antiinflamatorio',
    mech:'Inhibe COX-1 y COX-2 · Antiinflamatorio, analgésico y antipirético',
    ind:'Dolor dental, inflamación postoperatoria, fiebre. 400 mg para cirugías simples; 600 mg en cirugías más complejas. Siempre con alimentos.',
    alerts:['danger:No usar en menores de 6 meses o peso < 7 kg.','warning:Siempre con alimentos o leche. Dosis máxima adulto: 2.400 mg/día.','danger:Pacientes HIPERTENSOS: máx 3 días con vigilancia. Puede elevar la presión arterial.','warning:Precaución en pacientes con daño hepático. Evitar en insuficiencia hepática severa.'],
    vias:{
      oral:{ freq:'Cada 6–8 horas · 3 a 5 días según indicación · Con alimentos',
        formatos:[
          {name:'Suspensión oral 100 mg/5ml',conc:100,per:5,resUnit:'ml',tag:'suspension',label:'100 mg/5 ml · Pediátrico · Salcobrand'},
          {name:'Suspensión oral 200 mg/5ml FORTE',conc:200,per:5,resUnit:'ml',tag:'suspension',label:'200 mg/5 ml · Ipson Forte · OPKO'},
          {name:'Comprimido 200 mg',conc:200,per:1,resUnit:'comp',tag:'comprimido',label:'200 mg/comp'},
          {name:'Comprimido 400 mg',conc:400,per:1,resUnit:'comp',tag:'comprimido',label:'400 mg/comp · cirugías simples'},
          {name:'Comprimido 600 mg',conc:600,per:1,resUnit:'comp',tag:'comprimido',label:'600 mg/comp · cirugías complejas'},
        ],
        dosisNino:{min:5,max:10}, dosisAdulto:{fixed:true,min:400,max:600}},
    },
    refAlerts:[
      {t:'danger',m:'Contraindicado en < 6 meses o peso < 7 kg.'},
      {t:'danger',m:'Pacientes hipertensos: máx 3 días con vigilancia. Puede elevar la presión arterial.'},
      {t:'warning',m:'Precaución en hepatopatía. Evitar en insuficiencia hepática severa.'},
      {t:'warning',m:'Siempre con alimentos. Dosis máx adulto: 2.400 mg/día (MINSAL).'}
    ],
    refDosis:[{via:'Oral',nino:'5–10 mg/kg/dosis',adulto:'400 mg (cirugía simple) · 600 mg (cirugía compleja)',freq:'c/6–8h · 3–5 días · máx 2.400 mg/día'}]
  },
  diclofenaco:{
    cat:'analg', name:'Diclofenaco sódico', desc:'AINE · Alt. ibuprofeno',
    mech:'Inhibe COX-1 y COX-2 · No menores de 1 año ni < 10 kg',
    ind:'Dolor e inflamación moderada a severa. Alternativa a ibuprofeno.',
    alerts:['danger:Contraindicado en menores de 1 año o peso < 10 kg.','warning:Con alimentos. Máx 2–3 días.'],
    vias:{
      oral:{ freq:'Cada 8–12 horas · Máximo 2–3 días · Con alimentos',
        formatos:[
          {name:'Gotas 15 mg/ml',conc:15,per:1,resUnit:'gotas',gttFactor:30,tag:'gotas',label:'15 mg/ml · 30 gtt/ml'},
          {name:'Comprimido 25 mg',conc:25,per:1,resUnit:'comp',tag:'comprimido',label:'25 mg/comp'},
          {name:'Comprimido 50 mg',conc:50,per:1,resUnit:'comp',tag:'comprimido',label:'50 mg/comp'},
        ],
        dosisNino:{min:0.5,max:2,porDia:true,tomas:2,maxDia:150},
        dosisAdulto:{fixed:true,min:50,max:100}},
      rectal:{ freq:'1 vez al día (dosis diaria única)',
        formatos:[
          {name:'Supositorio 12,5 mg',conc:12.5,per:1,resUnit:'supositorios',tag:'supositorio',label:'12,5 mg'},
          {name:'Supositorio 25 mg',conc:25,per:1,resUnit:'supositorios',tag:'supositorio',label:'25 mg'},
          {name:'Supositorio 50 mg',conc:50,per:1,resUnit:'supositorios',tag:'supositorio',label:'50 mg'},
        ],
        dosisNino:{min:3,max:5,porDia:true,tomas:1,maxDia:150},
        dosisAdulto:{fixed:true,min:50,max:100}},
    },
    refAlerts:[{t:'danger',m:'Contraindicado < 1 año o peso < 10 kg.'},{t:'warning',m:'Dosis en gotas: 1–3 gotas/kg/DÍA divididas en 2 tomas.'}],
    refDosis:[{via:'Oral (comp)',nino:'0,5–2 mg/kg/dosis',adulto:'50–100 mg (fija)',freq:'c/8–12h · 2–3 días'},{via:'Oral (gotas)',nino:'1–3 gotas/kg/DÍA ÷2',adulto:'—',freq:'c/12h'},{via:'Rectal',nino:'3–5 mg/kg/DÍA',adulto:'50–100 mg/día',freq:'1 vez al día'}]
  },
  ketorolaco:{
    cat:'analg', name:'Ketorolaco EV', desc:'AINE parenteral · Dolor severo',
    mech:'Inhibe COX · Dolor moderado a severo · >2 años · Hospitalario',
    ind:'Dolor postoperatorio o moderado/severo. Solo hospitalario. >2 años.',
    alerts:['danger:Uso exclusivamente hospitalario.','danger:No usar más de 2 días en niños.','warning:Dosis máxima diaria: 60 mg.'],
    vias:{
      endovenosa:{ freq:'Dosis única: 1 vez · Múltiple: c/6–8h · Máx 2 días',
        formatos:[{name:'Ampolla 30 mg/ml',conc:30,per:1,resUnit:'ml',tag:'ampolla',label:'30 mg/ml · 1 ml'}],
        dosisNino:{min:0.5,max:1,maxDosis:30}, dosisAdulto:{fixed:true,min:15,max:30}},
    },
    refAlerts:[{t:'danger',m:'Solo hospitalario. Máx 2 días en niños. Dosis máx 60 mg/día.'}],
    refDosis:[{via:'EV',nino:'0,5–1 mg/kg/dosis (máx 30 mg)',adulto:'15–30 mg (fija)',freq:'Única o c/6–8h · máx 2 días'}]
  },
  naproxeno:{
    cat:'analg', name:'Naproxeno sódico', desc:'AINE · >2 años',
    mech:'Inhibe COX-1 y COX-2 · Larga duración de acción · Solo >2 años',
    ind:'Dolor e inflamación dental. AINE de larga duración. Dos pautas adulto: 250–500 mg c/12h o 275 mg c/6–8h (pauta MINSAL). Solo en mayores de 2 años.',
    alerts:['danger:Contraindicado en menores de 2 años.','warning:Dosis máxima: 15 mg/kg/día · Máx 1 g/día.','warning:Precaución con anticoagulantes, warfarina e hipoglicemiantes. Alta unión a proteínas.'],
    vias:{
      oral:{ freq:'Cada 6–8 horas (275 mg) o cada 12 horas (250–500 mg) · Máx 1 g/día',
        formatos:[
          {name:'Suspensión 125 mg/5ml',conc:125,per:5,resUnit:'ml',tag:'suspension',label:'125 mg/5 ml'},
          {name:'Comprimido 100 mg',conc:100,per:1,resUnit:'comp',tag:'comprimido',label:'100 mg/comp'},
          {name:'Comprimido 250 mg',conc:250,per:1,resUnit:'comp',tag:'comprimido',label:'250 mg/comp'},
          {name:'Comprimido 275 mg',conc:275,per:1,resUnit:'comp',tag:'comprimido',label:'275 mg/comp · pauta MINSAL c/6–8h'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp · pauta c/12h'},
        ],
        dosisNino:{min:5,max:7.5,maxDia:1000}, dosisAdulto:{fixed:true,min:275,max:500}},
      rectal:{ freq:'Cada 12 horas',
        formatos:[{name:'Supositorio 50 mg',conc:50,per:1,resUnit:'supositorios',tag:'supositorio',label:'50 mg'}],
        dosisNino:{min:5,max:7.5,maxDia:1000}, dosisAdulto:{fixed:true,min:250,max:500}},
    },
    refAlerts:[
      {t:'danger',m:'Contraindicado < 2 años y en embarazo.'},
      {t:'warning',m:'Dos pautas adulto: 275 mg c/6–8h (MINSAL) · o · 250–500 mg c/12h. Dosis inicial día 1: 550 mg.'},
      {t:'warning',m:'Alta afinidad a proteínas. Precaución con warfarina, anticoagulantes, hidantoína e hipoglicemiantes.'}
    ],
    refDosis:[
      {via:'Oral adulto (pauta MINSAL)',nino:'—',adulto:'550 mg día 1 → 275 mg c/6–8h',freq:'3–5 días · máx 1 g/día'},
      {via:'Oral adulto (pauta c/12h)',nino:'—',adulto:'250–500 mg',freq:'c/12h · 3–5 días'},
      {via:'Oral niño',nino:'5–7,5 mg/kg/dosis',adulto:'—',freq:'c/12h · máx 1 g/día'}
    ]
  },
  amoxicilina:{
    cat:'atb', name:'Amoxicilina', desc:'ATB · Betalactámico',
    mech:'Inhibe síntesis de pared bacteriana · Bactericida de amplio espectro',
    ind:'Primera línea en infecciones odontogénicas. Adulto habitual: 500 mg c/8h. En infecciones severas o inmunocomprometidos: 1 g c/8h (agregar protector gástrico).',
    alerts:[
      'warning:Completar el ciclo completo aunque mejoren los síntomas.',
      'info:Profilaxis ATB: 2 g adulto o 50 mg/kg niño · 30–60 min antes del procedimiento.',
      'warning:Si se indica 1 g c/8h en adultos: agregar gastroprotector (omeprazol 20 mg) por riesgo de reacción gastrointestinal.',
      'info:Infección grave: hasta 100 mg/kg/DÍA en niños.'
    ],
    vias:{
      oral:{ freq:'Cada 8 horas · Ciclo 7–10 días',
        formatos:[
          {name:'Suspensión 125 mg/5ml',conc:125,per:5,resUnit:'ml',tag:'suspension',label:'125 mg/5 ml · MINSAL'},
          {name:'Jarabe 250 mg/5ml',conc:250,per:5,resUnit:'ml',tag:'jarabe',label:'250 mg/5 ml · Salcobrand ✓'},
          {name:'Jarabe 500 mg/5ml',conc:500,per:5,resUnit:'ml',tag:'jarabe',label:'500 mg/5 ml · Salcobrand ✓'},
          {name:'Suspensión 1000 mg/5ml',conc:1000,per:5,resUnit:'ml',tag:'suspension',label:'1000 mg/5 ml · Amobiotic BID'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp · dosis habitual adulto'},
          {name:'Comp. dispersable 1 g',conc:1000,per:1,resUnit:'comp',tag:'dispersable',label:'1000 mg · inf. severa · + protector gástrico'},
        ],
        dosisNino:{min:20,max:45,porDia:true,tomas:3,maxDia:3000},
        dosisAdulto:{fixed:true,min:500,max:1000}},
    },
    refAlerts:[
      {t:'warning',m:'Completar el ciclo completo (7–10 días).'},
      {t:'info',m:'Profilaxis ATB: 2 g adulto · 50 mg/kg niño · 30–60 min antes.'},
      {t:'warning',m:'Dosis de 1 g c/8h en adultos: riesgo GI elevado → prescribir omeprazol 20 mg concomitante.'},
      {t:'info',m:'Niños (MINSAL): 20–45 mg/kg/día ÷ 3. Infección grave: hasta 100 mg/kg/día.'}
    ],
    refDosis:[
      {via:'Oral niño',nino:'20–45 mg/kg/DÍA ÷ 3 (MINSAL)',adulto:'—',freq:'c/8h · 7–10 días'},
      {via:'Oral adulto habitual',nino:'—',adulto:'500 mg',freq:'c/8h · 7 días'},
      {via:'Oral adulto inf. severa',nino:'—',adulto:'1.000 mg + protector gástrico',freq:'c/8h · 7–10 días'}
    ]
  },
  amoxiClav:{
    cat:'atb', name:'Amox/Ac. clavulánico', desc:'ATB · Resistencia amoxicilina',
    mech:'Amoxicilina + inhibidor betalactamasa · Infecciones resistentes o graves',
    ind:'Infecciones resistentes a amoxicilina sola. Otitis recurrente, sinusitis, infecciones agresivas.',
    alerts:['info:Indicado en resistencia a amoxicilina o infección grave.','warning:Completar los 7 días de tratamiento.'],
    vias:{
      oral:{ freq:'Cada 12 horas (2 tomas/día) · 7 días',
        formatos:[
          {name:'Susp. 250+62,5 mg/5ml',conc:250,per:5,resUnit:'ml',tag:'suspension',label:'250+62,5 mg/5 ml'},
          {name:'Susp. 400+57 mg/5ml',conc:400,per:5,resUnit:'ml',tag:'suspension',label:'400+57 mg/5 ml'},
          {name:'Susp. 800+57 mg/5ml',conc:800,per:5,resUnit:'ml',tag:'suspension',label:'800+57 mg/5 ml'},
          {name:'Comp. disp. 875+125 mg',conc:875,per:1,resUnit:'comp',tag:'dispersable',label:'875+125 mg · Dispersable'},
          {name:'Comp. 1000+125 mg',conc:1000,per:1,resUnit:'comp',tag:'comprimido',label:'1000+125 mg'},
        ],
        dosisNino:{min:50,max:80,porDia:true,tomas:2,maxDia:3200},
        dosisAdulto:{fixed:true,min:875,max:1000}},
    },
    refAlerts:[{t:'info',m:'Usar cuando hay resistencia a amoxicilina.'},{t:'warning',m:'Completar 7 días.'}],
    refDosis:[{via:'Oral',nino:'50–80 mg/kg/DÍA ÷ 2',adulto:'875–1000 mg (fija)',freq:'c/12h · 7 días'}]
  },
  penicilinaG:{
    cat:'atb', name:'Bencilpenicilina G', desc:'ATB · Penicilina G · UI',
    mech:'Inhibe síntesis pared bacteriana · Bactericida · Infecciones graves hospitalizadas',
    ind:'Infecciones graves: sepsis, meningitis, neumonía grave, infecciones de tejidos blandos.',
    alerts:['danger:Uso exclusivamente hospitalario.','danger:Verificar alergia a penicilinas antes de administrar.','info:Infección grave: 300.000 UI/kg/DÍA.'],
    vias:{
      endovenosa:{ freq:'Cada 6 horas (4 veces/día) · Hasta 48 h según evolución',
        formatos:[
          {name:'Ampolla 1.000.000 UI',conc:1000000,per:1,resUnit:'UI',tag:'ampolla',label:'1.000.000 UI/ampolla'},
          {name:'Ampolla 2.000.000 UI',conc:2000000,per:1,resUnit:'UI',tag:'ampolla',label:'2.000.000 UI/ampolla'},
        ],
        dosisNino:{min:50000,max:200000,porDia:true,tomas:4,maxDia:24000000,esUI:true},
        dosisAdulto:{fixed:true,min:1000000,max:4000000,esUI:true}},
    },
    refAlerts:[{t:'danger',m:'Solo hospitalario. Verificar alergia.'},{t:'info',m:'Infección grave: 300.000 UI/kg/DÍA.'}],
    refDosis:[{via:'EV',nino:'50.000–200.000 UI/kg/DÍA ÷ 4',adulto:'1.000.000–4.000.000 UI (fija)',freq:'c/6h · Máx 48h'}]
  },
  metronidazol:{
    cat:'atb', name:'Metronidazol', desc:'ATB · Anaerobios · Protozoos',
    mech:'Bactericida de anaerobios y protozoos · Complemento a bencilpenicilina',
    ind:'Infecciones por anaerobios, complemento a penicilina G en infecciones graves.',
    alerts:['warning:Complementar con penicilina G en infecciones graves.','warning:Dosis máxima diaria: 4 g.'],
    vias:{
      oral:{ freq:'Cada 8 horas (3 tomas/día) · 5–7 días',
        formatos:[
          {name:'Suspensión 125 mg/5ml',conc:125,per:5,resUnit:'ml',tag:'suspension',label:'125 mg/5 ml'},
          {name:'Suspensión 250 mg/5ml',conc:250,per:5,resUnit:'ml',tag:'suspension',label:'250 mg/5 ml'},
          {name:'Comprimido 250 mg',conc:250,per:1,resUnit:'comp',tag:'comprimido',label:'250 mg/comp'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp'},
        ],
        dosisNino:{min:20,max:30,porDia:true,tomas:3,maxDia:4000},
        dosisAdulto:{fixed:true,min:500,max:500}},
    },
    refAlerts:[{t:'warning',m:'Complementar con penicilina G en infecciones graves.'},{t:'warning',m:'Máx 4 g/día.'}],
    refDosis:[{via:'Oral',nino:'20–30 mg/kg/DÍA ÷ 3',adulto:'500 mg (fija)',freq:'c/8h · 5–7 días'}]
  },
  claritromicina:{
    cat:'atb', name:'Claritromicina', desc:'ATB · Macrólido',
    mech:'Inhibe síntesis proteica bacteriana · Alternativa a penicilinas en alergia',
    ind:'Infecciones respiratorias. Alternativa a amoxicilina en alergia a penicilinas.',
    alerts:['info:Dosis máxima diaria: 1 g/día.','warning:Completar los 7 días de tratamiento.'],
    vias:{
      oral:{ freq:'Cada 12 horas (2 tomas/día) · 7 días',
        formatos:[
          {name:'Suspensión 125 mg/5ml',conc:125,per:5,resUnit:'ml',tag:'suspension',label:'125 mg/5 ml'},
          {name:'Suspensión 250 mg/5ml',conc:250,per:5,resUnit:'ml',tag:'suspension',label:'250 mg/5 ml'},
          {name:'Comprimido 250 mg',conc:250,per:1,resUnit:'comp',tag:'comprimido',label:'250 mg/comp'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp'},
        ],
        dosisNino:{min:7.5,max:15,porDia:true,tomas:2,maxDia:1000},
        dosisAdulto:{fixed:true,min:250,max:500}},
    },
    refAlerts:[{t:'info',m:'Máx 1 g/día.'},{t:'warning',m:'Completar 7 días.'}],
    refDosis:[{via:'Oral',nino:'7,5–15 mg/kg/DÍA ÷ 2',adulto:'250–500 mg (fija)',freq:'c/12h · 7 días'}]
  },
  azitromicina:{
    cat:'atb', name:'Azitromicina', desc:'ATB · Macrólido · 1 vez/día',
    mech:'Inhibe síntesis proteica · Macrólido de larga duración · Alergia a penicilinas',
    ind:'Alternativa en alergia a penicilinas y metronidazol (ej. embarazo). Adulto: 500 mg/día × 3 días, o 500 mg día 1 → 250 mg días 2–5. Niños: 10 mg/kg día 1, 5 mg/kg días 2–5.',
    alerts:[
      'danger:Tomar 1 hora ANTES o 2 horas DESPUÉS de las comidas (en ayunas). Los alimentos reducen su absorción.',
      'info:Día 1: 10 mg/kg niño / 500 mg adulto. Días 2–5: 5 mg/kg niño / 250 mg adulto. Dosis máx: 500 mg/día.',
      'info:Profilaxis ATB: 15 mg/kg · 30–60 min antes.',
      'warning:Precaución en insuficiencia hepática. Hipersensibilidad conocida a macrólidos: contraindicada.'
    ],
    vias:{
      oral:{ freq:'1 vez al día EN AYUNAS · 3–5 días (días 2–5: mitad de dosis)',
        formatos:[
          {name:'Suspensión 200 mg/5ml',conc:200,per:5,resUnit:'ml',tag:'suspension',label:'200 mg/5 ml'},
          {name:'Suspensión 400 mg/5ml',conc:400,per:5,resUnit:'ml',tag:'suspension',label:'400 mg/5 ml'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp'},
        ],
        dosisNino:{min:10,max:10,maxDia:500},
        dosisAdulto:{fixed:true,min:500,max:500}},
    },
    refAlerts:[
      {t:'danger',m:'Tomar en ayunas: 1 hora antes o 2 horas después de las comidas (MINSAL).'},
      {t:'info',m:'Adulto: 500 mg/día × 3 días · o · 500 mg día 1 → 250 mg días 2–5.'},
      {t:'info',m:'Niño: 10 mg/kg día 1 → 5 mg/kg días 2–5. Máx 500 mg/día.'},
      {t:'info',m:'Profilaxis: 15 mg/kg · 30–60 min antes.'},
      {t:'warning',m:'Precaución en insuficiencia hepática. Contraindicada en hipersensibilidad a macrólidos.'}
    ],
    refDosis:[
      {via:'Oral adulto (3 días)',nino:'—',adulto:'500 mg/día',freq:'1 vez/día en ayunas × 3 días'},
      {via:'Oral adulto (5 días)',nino:'—',adulto:'500 mg día 1 → 250 mg días 2–5',freq:'1 vez/día en ayunas'},
      {via:'Oral niño',nino:'10 mg/kg día 1 → 5 mg/kg días 2–5',adulto:'—',freq:'1 vez/día en ayunas · máx 500 mg/día'}
    ]
  },
  clindamicina:{
    cat:'atb', name:'Clindamicina', desc:'ATB · Alergia penicilinas',
    mech:'Inhibe síntesis proteica · Alternativa en alergia a betalactámicos · Anaerobios',
    ind:'Infecciones en alergia a penicilinas. Infecciones por anaerobios.',
    alerts:['info:Infección grave EV: 40 mg/kg/DÍA.','info:Profilaxis: 20 mg/kg · 30–60 min antes (máx 600 mg).','warning:Dosis máxima: 1,8 g/día.'],
    vias:{
      oral:{ freq:'Cada 8 horas (3 tomas/día) · 7 días',
        formatos:[{name:'Cápsula 300 mg',conc:300,per:1,resUnit:'cápsulas',tag:'capsula',label:'300 mg/cápsula'}],
        dosisNino:{min:20,max:40,porDia:true,tomas:3,maxDia:1800},
        dosisAdulto:{fixed:true,min:300,max:450}},
      endovenosa:{ freq:'Cada 8 horas · IV lento',
        formatos:[
          {name:'Ampolla 150 mg/ml (4ml)',conc:150,per:1,resUnit:'ml',tag:'ampolla',label:'150 mg/ml · 600 mg/4ml'},
          {name:'Ampolla 150 mg/ml (2ml)',conc:150,per:1,resUnit:'ml',tag:'ampolla',label:'150 mg/ml · 300 mg/2ml'},
        ],
        dosisNino:{min:20,max:40,porDia:true,tomas:3,maxDia:1800},
        dosisAdulto:{fixed:true,min:600,max:900}},
    },
    refAlerts:[{t:'info',m:'Infección grave EV: 40 mg/kg/día.'},{t:'info',m:'Profilaxis: 20 mg/kg · 30–60 min antes (máx 600 mg).'},{t:'warning',m:'Máx 1,8 g/día.'}],
    refDosis:[{via:'Oral',nino:'20–40 mg/kg/DÍA ÷ 3',adulto:'300–450 mg (fija)',freq:'c/8h · 7 días'},{via:'EV',nino:'20–40 mg/kg/DÍA ÷ 3',adulto:'600–900 mg (fija)',freq:'c/8h · IV lento'}]
  },
  eritromicina:{
    cat:'atb', name:'Eritromicina', desc:'ATB · Macrólido clásico',
    mech:'Inhibe síntesis proteica · Bacteriostático · Alternativa en alergia a penicilinas',
    ind:'Alternativa clásica a penicilinas en alergia. Infecciones respiratorias.',
    alerts:['warning:Dosis máxima diaria: 4 g.','warning:Administrar con alimentos para reducir molestias GI.'],
    vias:{
      oral:{ freq:'Cada 8 horas (3 tomas/día) · 7 días',
        formatos:[
          {name:'Suspensión 200 mg/5ml',conc:200,per:5,resUnit:'ml',tag:'suspension',label:'200 mg/5 ml'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp'},
        ],
        dosisNino:{min:40,max:50,porDia:true,tomas:3,maxDia:4000},
        dosisAdulto:{fixed:true,min:500,max:500}},
    },
    refAlerts:[{t:'warning',m:'Máx 4 g/día.'},{t:'warning',m:'Siempre con alimentos.'}],
    refDosis:[{via:'Oral',nino:'40–50 mg/kg/DÍA ÷ 3',adulto:'500 mg (fija)',freq:'c/8h · 7 días'}]
  },
  metoclopramida:{
    cat:'gastro', name:'Metoclopramida', desc:'Antiemético · Procinético',
    mech:'Antagonista dopaminérgico · Náuseas, vómitos, reflujo gastroesofágico',
    ind:'Náuseas y vómitos. Reflujo gastroesofágico. No usar más de 5 días.',
    alerts:['danger:Contraindicada en menores de 1 año. Extrema precaución en lactantes.','warning:Máximo 5 días de tratamiento.'],
    vias:{
      oral:{ freq:'Cada 8 horas · 30 min antes de comidas · Máx 5 días',
        formatos:[
          {name:'Gotas 0,1 mg/gota',conc:0.1,per:1,resUnit:'gotas',tag:'gotas',label:'0,1 mg/gota · Itan Gotas · Saval ✓'},
          {name:'Comprimido 10 mg',conc:10,per:1,resUnit:'comp',tag:'comprimido',label:'10 mg/comp · Itan'},
        ],
        dosisNino:{min:0.1,max:0.15}, dosisAdulto:{fixed:true,min:10,max:10}},
      endovenosa:{ freq:'Cada 8 horas · IV lento (mín 3 min)',
        formatos:[{name:'Ampolla 5 mg/ml',conc:5,per:1,resUnit:'ml',tag:'ampolla',label:'5 mg/ml · 2 ml ampolla'}],
        dosisNino:{min:0.1,max:0.15}, dosisAdulto:{fixed:true,min:10,max:10}},
    },
    refAlerts:[{t:'danger',m:'Contraindicada < 1 año.'},{t:'warning',m:'Máx 5 días. En Chile: presentación oral como GOTAS (0,1 mg/gota), no jarabe.'}],
    refDosis:[{via:'Oral',nino:'0,1–0,15 mg/kg/dosis',adulto:'10 mg (fija)',freq:'c/8h · 30 min antes · máx 5 días'},{via:'EV',nino:'0,1–0,15 mg/kg/dosis',adulto:'10 mg (fija)',freq:'c/8h · IV lento mín 3 min'}]
  }
  ,clonixinato:{
    cat:'analg', name:'Clonixinato de lisina', desc:'AINE · Analgésico dental',
    mech:'Inhibidor COX periférico · Analgésico y antiinflamatorio · Alta selectividad en dolor dental',
    ind:'Dolor dental agudo de intensidad leve a moderada. Muy usado en odontología. Posología 3 o 5 días según intensidad.',
    alerts:[
      'warning:Administrar con precaución en pacientes ulcerosos.',
      'warning:No administrar en embarazo.',
      'info:125 mg: 1–2 comprimidos 3 veces al día según intensidad del dolor (MINSAL).'
    ],
    vias:{
      oral:{ freq:'3 veces al día · 3 a 5 días según intensidad · Con alimentos',
        formatos:[
          {name:'Comprimido 125 mg',conc:125,per:1,resUnit:'comp',tag:'comprimido',label:'125 mg/comp · Sindolac, Dorixina'},
          {name:'Comprimido 250 mg',conc:250,per:1,resUnit:'comp',tag:'comprimido',label:'250 mg/comp'},
        ],
        dosisNino:{min:2,max:4,maxDia:375},
        dosisAdulto:{fixed:true,min:125,max:250}},
    },
    refAlerts:[
      {t:'warning',m:'Contraindicado en embarazo.'},
      {t:'warning',m:'Precaución en pacientes con úlcera gástrica o gastritis.'},
      {t:'info',m:'Dosis MINSAL: 125 mg · 1–2 comp · 3 veces al día · 3 o 5 días.'}
    ],
    refDosis:[{via:'Oral',nino:'2–4 mg/kg/dosis',adulto:'125–250 mg',freq:'3 veces al día · 3–5 días'}]
  },
  ketoprofeno:{
    cat:'analg', name:'Ketoprofeno', desc:'AINE · Propiônico',
    mech:'Inhibe COX-1 y COX-2 · Potente analgésico y antiinflamatorio · Uso postoperatorio dental',
    ind:'Dolor postoperatorio dental, pericoronaritis, alveolitis. Alternativa a ibuprofeno con mayor potencia.',
    alerts:['warning:Administrar con alimentos. Máx 5 días.','warning:Evitar en pacientes con úlcera o insuficiencia renal.'],
    vias:{
      oral:{ freq:'Cada 8–12 horas · Máx 5 días · Con alimentos',
        formatos:[
          {name:'Cápsula 50 mg',conc:50,per:1,resUnit:'cápsulas',tag:'capsula',label:'50 mg/cáps · Salcobrand ✓'},
          {name:'Comprimido 100 mg',conc:100,per:1,resUnit:'comp',tag:'comprimido',label:'100 mg/comp · Profenid, Dolostat'},
          {name:'Comp. lib. prolongada 200 mg',conc:200,per:1,resUnit:'comp',tag:'comprimido',label:'200 mg/comp · Cruz Verde ✓'},
        ],
        dosisNino:{min:1,max:2,maxDia:100},
        dosisAdulto:{fixed:true,min:50,max:100}},
    },
    refAlerts:[{t:'warning',m:'Con alimentos. Máx 5 días.'},{t:'warning',m:'Contraindicado en insuficiencia renal o úlcera péptica activa.'}],
    refDosis:[{via:'Oral',nino:'1–2 mg/kg/dosis',adulto:'50–100 mg (fija)',freq:'c/8–12h · máx 5 días'}]
  },
  dexketoprofeno:{
    cat:'analg', name:'Dexketoprofeno', desc:'AINE · Enantiómero activo',
    mech:'Isómero activo del ketoprofeno · Mayor potencia analgésica · Inicio rápido de acción',
    ind:'Dolor dental agudo postoperatorio. Inicio de acción en 20–30 min. Muy usado en odontología.',
    alerts:['warning:Administrar con alimentos o leche. Máx 3–5 días.','info:Inicio de acción más rápido que ibuprofeno estándar.'],
    vias:{
      oral:{ freq:'Cada 8 horas · Máx 3–5 días · Con alimentos',
        formatos:[
          {name:'Comprimido 25 mg',conc:25,per:1,resUnit:'comp',tag:'comprimido',label:'25 mg/comp · DEX, Dexketoprofeno Farma'},
          {name:'Sobre granulado 25 mg',conc:25,per:1,resUnit:'sobres',tag:'solucion',label:'25 mg/sobre · solución oral'},
        ],
        dosisNino:{min:0.5,max:1,maxDia:75},
        dosisAdulto:{fixed:true,min:25,max:25}},
    },
    refAlerts:[{t:'warning',m:'Con alimentos. Máx 3–5 días.'},{t:'info',m:'Inicio de acción más rápido que ibuprofeno. Muy útil en dolor dental agudo.'}],
    refDosis:[{via:'Oral',nino:'0,5–1 mg/kg/dosis',adulto:'25 mg (fija)',freq:'c/8h · máx 3–5 días'}]
  },
  meloxicam:{
    cat:'analg', name:'Meloxicam', desc:'AINE · COX-2 preferente',
    mech:'Inhibidor preferente COX-2 · Mayor selectividad gástrica · Larga duración (24h)',
    ind:'Dolor e inflamación postoperatoria. Dosis única diaria. Mejor tolerancia gástrica que ibuprofeno.',
    alerts:['warning:Administrar con alimentos. Dosis 1 vez al día.','info:Mayor selectividad COX-2: mejor tolerancia gástrica. No apto < 15 años.'],
    vias:{
      oral:{ freq:'1 vez al día · Con alimentos · Máx 5 días',
        formatos:[
          {name:'Comprimido 7,5 mg',conc:7.5,per:1,resUnit:'comp',tag:'comprimido',label:'7,5 mg/comp · Salcobrand ✓'},
          {name:'Comprimido 15 mg',conc:15,per:1,resUnit:'comp',tag:'comprimido',label:'15 mg/comp · Salcobrand ✓'},
        ],
        dosisNino:{min:0.1,max:0.2,maxDia:15},
        dosisAdulto:{fixed:true,min:7.5,max:15}},
    },
    refAlerts:[{t:'warning',m:'1 vez al día. Con alimentos.'},{t:'info',m:'No recomendado en < 15 años. Mejor perfil gástrico que AINEs no selectivos.'}],
    refDosis:[{via:'Oral',nino:'0,1–0,2 mg/kg/día (máx 15 mg)',adulto:'7,5–15 mg (fija)',freq:'1 vez/día · máx 5 días'}]
  },
  celecoxib:{
    cat:'analg', name:'Celecoxib', desc:'AINE · Inhibidor COX-2 selectivo',
    mech:'Inhibidor selectivo COX-2 · Mínimo efecto sobre mucosa gástrica · No afecta plaquetas',
    ind:'Dolor postoperatorio dental. Pacientes con riesgo gastrointestinal o que toman anticoagulantes.',
    alerts:['info:No afecta la función plaquetaria: útil en pacientes anticoagulados.','warning:Precaución en pacientes con riesgo cardiovascular.'],
    vias:{
      oral:{ freq:'Cada 12 horas · Máx 5 días',
        formatos:[
          {name:'Cápsula 100 mg',conc:100,per:1,resUnit:'cápsulas',tag:'capsula',label:'100 mg/cáps · Celebra, Celedox'},
          {name:'Cápsula 200 mg',conc:200,per:1,resUnit:'cápsulas',tag:'capsula',label:'200 mg/cáps · Salcobrand ✓'},
        ],
        dosisNino:{min:3,max:6,maxDia:400},
        dosisAdulto:{fixed:true,min:100,max:200}},
    },
    refAlerts:[{t:'info',m:'No inhibe plaquetas: útil en anticoagulados o hemofilia.'},{t:'warning',m:'Precaución en enfermedad cardiovascular.'}],
    refDosis:[{via:'Oral',nino:'3–6 mg/kg/dosis (>2 años, >10 kg)',adulto:'100–200 mg (fija)',freq:'c/12h · máx 5 días'}]
  },
  aspirina:{
    cat:'analg', name:'Aspirina (AAS)', desc:'AINE · Analgésico clásico',
    mech:'Inhibe COX de forma irreversible · Analgésico, antipirético, antiinflamatorio y antiagregante plaquetario',
    ind:'Dolor leve a moderado. Precaución: inhibe agregación plaquetaria de forma permanente (7-10 días).',
    alerts:['danger:Inhibe plaquetas IRREVERSIBLEMENTE por 7–10 días. Evitar antes de cirugía.','warning:No usar en menores de 16 años por riesgo de síndrome de Reye.'],
    vias:{
      oral:{ freq:'Cada 6–8 horas · Máx 3 días',
        formatos:[
          {name:'Comprimido 100 mg',conc:100,per:1,resUnit:'comp',tag:'comprimido',label:'100 mg · uso cardiovascular'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg · uso analgésico'},
        ],
        dosisNino:{min:10,max:15,maxDia:60},
        dosisAdulto:{fixed:true,min:500,max:1000}},
    },
    refAlerts:[{t:'danger',m:'Inhibe plaquetas irreversiblemente. Suspender 7–10 días antes de cirugía.'},{t:'danger',m:'Contraindicada en < 16 años (síndrome de Reye).'}],
    refDosis:[{via:'Oral',nino:'10–15 mg/kg/dosis (>16 años)',adulto:'500–1000 mg (fija)',freq:'c/6–8h · máx 3 días'}]
  },
  metamizol:{
    cat:'analg', name:'Metamizol (dipirona)', desc:'Analgésico · Antiespasmódico',
    mech:'Inhibe síntesis de prostaglandinas a nivel central y periférico · Potente analgésico y antipirético',
    ind:'Dolor postoperatorio moderado a severo. Cólico dental. Alternativa cuando AINEs están contraindicados.',
    alerts:['warning:Riesgo infrecuente de agranulocitosis. Uso máx 5 días.','info:Disponible en comprimidos y ampollas en Chile.'],
    vias:{
      oral:{ freq:'Cada 6–8 horas · Máx 5 días',
        formatos:[
          {name:'Comprimido 300 mg',conc:300,per:1,resUnit:'comp',tag:'comprimido',label:'300 mg/comp · Cruz Verde ✓'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp'},
        ],
        dosisNino:{min:10,max:20,maxDia:3000},
        dosisAdulto:{fixed:true,min:500,max:1000}},
      endovenosa:{ freq:'Cada 6–8 horas · IV lento o IM',
        formatos:[
          {name:'Ampolla 1g/2ml',conc:500,per:1,resUnit:'ml',tag:'ampolla',label:'500 mg/ml · 1g/2ml · Cruz Verde ✓'},
        ],
        dosisNino:{min:10,max:20,maxDia:3000},
        dosisAdulto:{fixed:true,min:1000,max:2000}},
    },
    refAlerts:[{t:'warning',m:'Riesgo de agranulocitosis (infrecuente). Máx 5 días.'},{t:'info',m:'Potente analgésico. Útil cuando AINEs clásicos están contraindicados.'}],
    refDosis:[{via:'Oral',nino:'10–20 mg/kg/dosis',adulto:'500–1000 mg (fija)',freq:'c/6–8h · máx 5 días'},{via:'EV/IM',nino:'10–20 mg/kg/dosis',adulto:'1000–2000 mg (fija)',freq:'c/6–8h · lento'}]
  },
  /* ══════ NUEVOS: CORTICOIDES ══════ */
  dexametasona:{
    cat:'cort', name:'Dexametasona', desc:'Corticoide · Alta potencia',
    mech:'Corticosteroide sintético de alta potencia · 25–30× más potente que cortisol · Antiinflamatorio e inmunosupresor',
    ind:'Edema postoperatorio tercer molar, trismus, trombosis de tejidos. Vía oral o IM. El corticoide más usado en odontología.',
    alerts:['warning:No usar más de 3–5 días sin supervisión. Reducir dosis gradualmente en tratamientos largos.','info:0,75 mg dexametasona = 5 mg prednisona. En Chile: Cortyk (Cruz Verde ✓).'],
    vias:{
      oral:{ freq:'1–2 veces al día · Máx 3–5 días',
        formatos:[
          {name:'Comprimido 0,5 mg',conc:0.5,per:1,resUnit:'comp',tag:'comprimido',label:'0,5 mg/comp'},
          {name:'Comprimido 4 mg',conc:4,per:1,resUnit:'comp',tag:'comprimido',label:'4 mg/comp · Cortyk · Cruz Verde ✓'},
        ],
        dosisNino:{min:0.08,max:0.3,maxDia:10},
        dosisAdulto:{fixed:true,min:4,max:8}},
      endovenosa:{ freq:'1 vez al día o c/6h según indicación · IM o IV',
        formatos:[
          {name:'Ampolla 4 mg/ml (1ml)',conc:4,per:1,resUnit:'ml',tag:'ampolla',label:'4 mg/ml · 1ml · Ahumada, Farmex ✓'},
          {name:'Ampolla 8 mg/2ml',conc:4,per:1,resUnit:'ml',tag:'ampolla',label:'4 mg/ml · 2ml · 8 mg total'},
        ],
        dosisNino:{min:0.08,max:0.3,maxDia:10},
        dosisAdulto:{fixed:true,min:4,max:8}},
    },
    refAlerts:[{t:'warning',m:'Reducir dosis gradualmente. Máx 3–5 días en odontología.'},{t:'info',m:'0,75 mg dexametasona = 5 mg prednisona. Nombre comercial en Chile: Cortyk.'}],
    refDosis:[{via:'Oral',nino:'0,08–0,3 mg/kg/día',adulto:'4–8 mg (fija)',freq:'1–2 veces/día · máx 3–5 días'},{via:'IM/IV',nino:'0,08–0,3 mg/kg',adulto:'4–8 mg (fija)',freq:'1 vez/día · según indicación'}]
  },
  metilprednisolona:{
    cat:'cort', name:'Metilprednisolona', desc:'Corticoide · Potencia media-alta',
    mech:'Corticosteroide sintético · Menor retención de sodio que prednisona · Antiinflamatorio potente',
    ind:'Edema postoperatorio severo, exodoncias complejas, tercer molar inferior. Ciclos cortos de 3–5 días.',
    alerts:['warning:No usar más de 5 días sin supervisión médica.','info:4 mg metilprednisolona = 5 mg prednisona. Nombre comercial: Medrol.'],
    vias:{
      oral:{ freq:'Cada 12–24 horas · Máx 5 días',
        formatos:[
          {name:'Comprimido 4 mg',conc:4,per:1,resUnit:'comp',tag:'comprimido',label:'4 mg/comp · Medrol'},
          {name:'Comprimido 16 mg',conc:16,per:1,resUnit:'comp',tag:'comprimido',label:'16 mg/comp · Medrol'},
        ],
        dosisNino:{min:0.5,max:1.5,porDia:true,tomas:2,maxDia:32},
        dosisAdulto:{fixed:true,min:4,max:16}},
    },
    refAlerts:[{t:'warning',m:'Máx 5 días. Reducir gradualmente.'},{t:'info',m:'4 mg metilprednisolona ≈ 5 mg prednisona. Nombre: Medrol.'}],
    refDosis:[{via:'Oral',nino:'0,5–1,5 mg/kg/día ÷ 2',adulto:'4–16 mg (fija)',freq:'c/12–24h · máx 5 días'}]
  },
  prednisona:{
    cat:'cort', name:'Prednisona', desc:'Corticoide · Oral',
    mech:'Corticosteroide oral de referencia · Acción antiinflamatoria e inmunosupresora',
    ind:'Reacciones alérgicas graves, edema postoperatorio, tratamiento de lesiones inflamatorias orales.',
    alerts:['warning:Reducir dosis gradualmente si se usa más de 7 días.','info:5 mg prednisona = 0,75 mg dexametasona = 4 mg metilprednisolona.'],
    vias:{
      oral:{ freq:'1 vez al día (mañana) · Máx 7 días en ciclos cortos',
        formatos:[
          {name:'Comprimido 5 mg',conc:5,per:1,resUnit:'comp',tag:'comprimido',label:'5 mg/comp · Cruz Verde ✓'},
          {name:'Comprimido 20 mg',conc:20,per:1,resUnit:'comp',tag:'comprimido',label:'20 mg/comp · Bersen, Cortiprex ✓'},
        ],
        dosisNino:{min:0.5,max:1,maxDia:40},
        dosisAdulto:{fixed:true,min:5,max:20}},
    },
    refAlerts:[{t:'warning',m:'Reducir dosis gradualmente si > 7 días.'},{t:'info',m:'5 mg prednisona = 0,75 mg dexametasona.'}],
    refDosis:[{via:'Oral',nino:'0,5–1 mg/kg/día',adulto:'5–20 mg (fija)',freq:'1 vez/día (mañana) · máx 7 días'}]
  },
  betametasona:{
    cat:'cort', name:'Betametasona', desc:'Corticoide · Larga duración',
    mech:'Corticosteroide de alta potencia y larga duración · Sin retención de sodio',
    ind:'Tratamiento de lesiones inflamatorias orales, liquen plano, eritema multiforme. También depot IM.',
    alerts:['warning:Uso en ciclos cortos. Potencia similar a dexametasona.','info:Disponible en ampolla depot IM de larga duración en Chile.'],
    vias:{
      oral:{ freq:'1–2 veces al día · Máx 5 días',
        formatos:[
          {name:'Comprimido 0,5 mg',conc:0.5,per:1,resUnit:'comp',tag:'comprimido',label:'0,5 mg/comp'},
        ],
        dosisNino:{min:0.05,max:0.2,maxDia:4},
        dosisAdulto:{fixed:true,min:0.5,max:2}},
      endovenosa:{ freq:'Dosis única IM depot · efecto 3–4 semanas',
        formatos:[
          {name:'Ampolla 4 mg/ml depot',conc:4,per:1,resUnit:'ml',tag:'ampolla',label:'4 mg/ml · IM depot · Cruz Verde ✓'},
        ],
        dosisNino:{min:0.05,max:0.1,maxDia:4},
        dosisAdulto:{fixed:true,min:4,max:8}},
    },
    refAlerts:[{t:'warning',m:'Ciclos cortos. Similar potencia a dexametasona.'},{t:'info',m:'Ampolla depot disponible en Cruz Verde.'}],
    refDosis:[{via:'Oral',nino:'0,05–0,2 mg/kg/día',adulto:'0,5–2 mg (fija)',freq:'1–2 veces/día · máx 5 días'},{via:'IM depot',nino:'0,05–0,1 mg/kg',adulto:'4–8 mg (fija)',freq:'Dosis única · efecto 3–4 semanas'}]
  },
  /* ══════ NUEVOS: OPIOIDES ══════ */
  tramadol:{
    cat:'opio', name:'Tramadol', desc:'Opioide débil · Dolor moderado-severo',
    mech:'Agonista opioide débil + inhibidor recaptación serotonina/noradrenalina · Dolor moderado a severo',
    ind:'Dolor postoperatorio severo (tercer molar, cirugía maxilofacial). Receta retenida en Chile.',
    alerts:['danger:Receta retenida. Solo en > 16 años.','warning:Riesgo de dependencia. Máx 5 días en odontología.','warning:No combinar con depresores del SNC, alcohol ni benzodiacepinas.'],
    vias:{
      oral:{ freq:'Cada 6–8 horas · Máx 5 días',
        formatos:[
          {name:'Cápsula 50 mg',conc:50,per:1,resUnit:'cápsulas',tag:'capsula',label:'50 mg/cáps · Farmex, Sanitas ✓'},
          {name:'Comprimido 100 mg',conc:100,per:1,resUnit:'comp',tag:'comprimido',label:'100 mg/comp'},
          {name:'Gotas 100 mg/ml',conc:100,per:1,resUnit:'gotas',gttFactor:40,tag:'gotas',label:'100 mg/ml · 40 microgotas/ml'},
        ],
        dosisNino:{min:1,max:2,maxDia:400},
        dosisAdulto:{fixed:true,min:50,max:100}},
    },
    refAlerts:[{t:'danger',m:'Receta retenida. Solo > 16 años.'},{t:'warning',m:'Máx 5 días. Riesgo dependencia.'},{t:'warning',m:'No combinar con alcohol, benzodiacepinas ni depresores del SNC.'}],
    refDosis:[{via:'Oral',nino:'1–2 mg/kg/dosis (> 16 años)',adulto:'50–100 mg (fija)',freq:'c/6–8h · máx 5 días'}]
  },
  tramadolParacetamol:{
    cat:'opio', name:'Tramadol + Paracetamol', desc:'Opioide + analgésico · Combinación',
    mech:'Combinación sinérgica: opioide débil + inhibidor COX central · Dolor moderado a severo',
    ind:'Dolor dental postoperatorio moderado a severo. Reduce dosis de cada componente. Zaldiar en Chile.',
    alerts:['danger:Receta retenida. Solo en > 16 años.','warning:Dosis máxima: 8 comprimidos/día · Máx 5 días.'],
    vias:{
      oral:{ freq:'Cada 6 horas según necesidad · Máx 8 comp/día · Máx 5 días',
        formatos:[
          {name:'Comp. 37,5/325 mg',conc:37.5,per:1,resUnit:'comp',tag:'comprimido',label:'37,5 mg tramadol + 325 mg paracetamol · Zaldiar, Farmex ✓'},
        ],
        dosisNino:{min:1,max:2,maxDia:400},
        dosisAdulto:{fixed:true,min:37.5,max:75}},
    },
    refAlerts:[{t:'danger',m:'Receta retenida. Solo > 16 años.'},{t:'warning',m:'Máx 8 comprimidos/día · Máx 5 días.'}],
    refDosis:[{via:'Oral',nino:'— (solo > 16 años)',adulto:'37,5–75 mg tramadol (1–2 comp) (fija)',freq:'c/6h según dolor · máx 5 días'}]
  },
  codeina:{
    cat:'opio', name:'Codeína + Paracetamol', desc:'Opioide débil · Combinación',
    mech:'Codeína (profármaco de morfina) + paracetamol · Sinergia analgésica · Dolor moderado',
    ind:'Dolor postoperatorio moderado. Útil cuando ibuprofeno es insuficiente y tramadol es excesivo.',
    alerts:['danger:Receta retenida. Contraindicado en < 12 años y madres lactantes.','warning:Riesgo de depresión respiratoria en metabolizadores ultrarrápidos.'],
    vias:{
      oral:{ freq:'Cada 6 horas · Máx 3 días',
        formatos:[
          {name:'Comp. 30/500 mg',conc:30,per:1,resUnit:'comp',tag:'comprimido',label:'30 mg codeína + 500 mg paracetamol'},
          {name:'Jarabe codeína 10mg/5ml',conc:10,per:5,resUnit:'ml',tag:'jarabe',label:'10 mg/5 ml · Lab. Ifa ✓'},
        ],
        dosisNino:{min:0.5,max:1,maxDia:60},
        dosisAdulto:{fixed:true,min:30,max:60}},
    },
    refAlerts:[{t:'danger',m:'Receta retenida. Contraindicado < 12 años y lactancia.'},{t:'warning',m:'Riesgo depresión respiratoria. Máx 3 días.'}],
    refDosis:[{via:'Oral',nino:'0,5–1 mg/kg/dosis codeína (≥ 12 años)',adulto:'30–60 mg codeína (fija)',freq:'c/6h · máx 3 días'}]
  },
  /* ══════ NUEVOS: ANTIBIÓTICOS ══════ */
  doxiciclina:{
    cat:'atb', name:'Doxiciclina', desc:'ATB · Tetraciclina · Periodontal',
    mech:'Inhibe síntesis proteica bacteriana · Bacteriostático · Activo en gérmenes atípicos y periodontal',
    ind:'Periodontitis moderada/severa, enfermedad periodontal refractaria, infecciones por gérmenes atípicos.',
    alerts:['danger:Contraindicada en < 12 años, embarazo y lactancia (mancha dientes).','warning:Tomar con abundante agua. No acostarse 30 min tras ingesta. Fotosensibilidad.'],
    vias:{
      oral:{ freq:'1 vez al día · Ciclo 7–14 días',
        formatos:[
          {name:'Comprimido 100 mg',conc:100,per:1,resUnit:'comp',tag:'comprimido',label:'100 mg/comp · Salcobrand ✓'},
          {name:'Comp. dispersable 100 mg',conc:100,per:1,resUnit:'comp',tag:'dispersable',label:'100 mg · Doxithal · Cruz Verde ✓'},
        ],
        dosisNino:{min:2.2,max:4.4,porDia:true,tomas:1,maxDia:200},
        dosisAdulto:{fixed:true,min:100,max:200}},
    },
    refAlerts:[{t:'danger',m:'Contraindicada < 12 años, embarazo y lactancia.'},{t:'warning',m:'Fotosensibilidad: usar protector solar. Tomar con agua abundante.'}],
    refDosis:[{via:'Oral',nino:'2,2–4,4 mg/kg/día (≥ 12 años)',adulto:'100–200 mg (fija)',freq:'1 vez/día · 7–14 días'}]
  },
  ciprofloxacino:{
    cat:'atb', name:'Ciprofloxacino', desc:'ATB · Quinolona · Infecciones refractarias',
    mech:'Inhibe ADN girasa bacteriana (topoisomerasa II) · Bactericida de amplio espectro',
    ind:'Infecciones odontogénicas refractarias, osteomielitis maxilar, infecciones por gram negativos resistentes.',
    alerts:['danger:Contraindicado en menores de 18 años (daño cartílagos).','warning:Puede prolongar QT. No tomar con antiácidos, hierro o calcio.'],
    vias:{
      oral:{ freq:'Cada 12 horas · 7–10 días',
        formatos:[
          {name:'Comprimido 250 mg',conc:250,per:1,resUnit:'comp',tag:'comprimido',label:'250 mg/comp'},
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp · Cruz Verde ✓'},
        ],
        dosisNino:{min:10,max:20,porDia:true,tomas:2,maxDia:1500},
        dosisAdulto:{fixed:true,min:250,max:500}},
    },
    refAlerts:[{t:'danger',m:'Contraindicado < 18 años (daño cartílagos).'},{t:'warning',m:'No tomar junto a antiácidos, hierro ni calcio.'}],
    refDosis:[{via:'Oral',nino:'— (solo ≥ 18 años)',adulto:'250–500 mg (fija)',freq:'c/12h · 7–10 días'}]
  },
  /* ══════ NUEVOS: ANTIVIRALES ══════ */
  aciclovir:{
    cat:'antiviral', name:'Aciclovir', desc:'Antiviral · Herpes',
    mech:'Inhibe ADN polimerasa viral · Activo frente a VHS-1, VHS-2 y Varicela-Zóster',
    ind:'Herpes labial primario o recurrente severo, estomatitis herpética, herpes zóster orofacial.',
    alerts:['info:Para herpes labial leve: crema tópica 5%. Vía oral para infecciones moderadas-graves.','warning:Hidratarse bien durante el tratamiento. Ajustar dosis en insuficiencia renal.'],
    vias:{
      oral:{ freq:'Cada 4 horas (5 veces/día) · 5–7 días',
        formatos:[
          {name:'Comprimido 200 mg',conc:200,per:1,resUnit:'comp',tag:'comprimido',label:'200 mg/comp · Lab. Ifa ✓'},
          {name:'Comprimido 400 mg',conc:400,per:1,resUnit:'comp',tag:'comprimido',label:'400 mg/comp · Lab. Ifa ✓'},
          {name:'Crema tópica 5%',conc:50,per:1,resUnit:'aplicaciones',tag:'solucion',label:'5% crema · tubo 5g · Lab. Ifa ✓'},
        ],
        dosisNino:{min:20,max:20,porDia:true,tomas:5,maxDia:4000},
        dosisAdulto:{fixed:true,min:200,max:400}},
    },
    refAlerts:[{t:'info',m:'Herpes labial leve: crema 5% tópica. Oral para formas moderadas-graves.'},{t:'warning',m:'Hidratación adecuada. Ajustar en insuficiencia renal.'}],
    refDosis:[{via:'Oral',nino:'20 mg/kg/dosis (máx 400 mg) · 5 veces/día',adulto:'200–400 mg (fija)',freq:'5 veces/día (c/4h) · 5–7 días'}]
  },
  valaciclovir:{
    cat:'antiviral', name:'Valaciclovir', desc:'Antiviral · Herpes · Mejor biodisponibilidad',
    mech:'Profármaco del aciclovir · Mayor biodisponibilidad oral (55% vs 20%) · Menos tomas diarias',
    ind:'Herpes labial recurrente, herpes zóster orofacial. Ventaja: solo 2 tomas diarias vs 5 de aciclovir.',
    alerts:['info:Mayor biodisponibilidad que aciclovir: misma eficacia con menos tomas.','warning:Solo 2 tomas al día: mayor adherencia. Ajustar en insuf. renal.'],
    vias:{
      oral:{ freq:'Cada 12 horas · 5–7 días',
        formatos:[
          {name:'Comprimido 500 mg',conc:500,per:1,resUnit:'comp',tag:'comprimido',label:'500 mg/comp · Valtrex, genérico'},
          {name:'Comprimido 1000 mg',conc:1000,per:1,resUnit:'comp',tag:'comprimido',label:'1000 mg/comp'},
        ],
        dosisNino:{min:20,max:20,maxDia:2000},
        dosisAdulto:{fixed:true,min:500,max:1000}},
    },
    refAlerts:[{t:'info',m:'Profármaco aciclovir. Solo 2 tomas/día: mejor adherencia.'},{t:'warning',m:'Ajustar dosis en insuficiencia renal.'}],
    refDosis:[{via:'Oral',nino:'20 mg/kg/dosis (≥ 2 años)',adulto:'500–1000 mg (fija)',freq:'c/12h · 5–7 días'}]
  },
  /* ══════ NUEVOS: ANTIFÚNGICOS ══════ */
  nistatina:{
    cat:'antifung', name:'Nistatina', desc:'Antifúngico · Candidiasis oral',
    mech:'Se une a ergosterol de membrana fúngica → lisis celular · Candida spp · No se absorbe sistémicamente',
    ind:'Candidiasis oral (muguet). Primera línea en candidiasis oral localizada. Sin absorción sistémica = muy segura.',
    alerts:['info:No se absorbe: mínimos efectos sistémicos. Agitar bien antes de usar.','info:Hacer enjuague y tragar (swish and swallow) para máximo contacto.'],
    vias:{
      oral:{ freq:'4 veces al día · 7–14 días · Después de las comidas',
        formatos:[
          {name:'Suspensión 100.000 UI/ml',conc:100000,per:1,resUnit:'ml',tag:'suspension',label:'100.000 UI/ml · frasco 24–60 ml'},
        ],
        dosisNino:{min:100000,max:200000,esUI:true},
        dosisAdulto:{fixed:true,min:500000,max:1000000,esUI:true}},
    },
    refAlerts:[{t:'info',m:'No se absorbe sistémicamente. Muy segura en embarazo y niños.'},{t:'info',m:'Enjuague y tragar (swish and swallow) en cavidad oral.'}],
    refDosis:[{via:'Oral (suspensión)',nino:'100.000–200.000 UI/dosis',adulto:'500.000–1.000.000 UI (fija)',freq:'4 veces/día · 7–14 días'}]
  },
  fluconazol:{
    cat:'antifung', name:'Fluconazol', desc:'Antifúngico · Sistémico',
    mech:'Inhibe síntesis de ergosterol (lanosterol demetilasa) · Fungistático/fungicida · Absorción oral excelente',
    ind:'Candidiasis oral severa, refractaria a nistatina, inmunocomprometidos. Dosis única para candidiasis vaginal.',
    alerts:['warning:Múltiples interacciones medicamentosas (warfarina, antiepilépticos, estatinas).','info:En Chile: disponible en 50, 100 y 150 mg · Lab. Chile, Teva ✓.'],
    vias:{
      oral:{ freq:'1 vez al día · 7–14 días (oral) o dosis única 150 mg (candidiasis)',
        formatos:[
          {name:'Comprimido 50 mg',conc:50,per:1,resUnit:'comp',tag:'comprimido',label:'50 mg/comp'},
          {name:'Comprimido 100 mg',conc:100,per:1,resUnit:'comp',tag:'comprimido',label:'100 mg/comp'},
          {name:'Comprimido 150 mg',conc:150,per:1,resUnit:'comp',tag:'comprimido',label:'150 mg/comp · Lab. Chile ✓'},
        ],
        dosisNino:{min:3,max:6,maxDia:400},
        dosisAdulto:{fixed:true,min:100,max:200}},
    },
    refAlerts:[{t:'warning',m:'Interacciones: warfarina, estatinas, antiepilépticos. Revisar medicamentos concomitantes.'},{t:'info',m:'En Chile: 50, 100 y 150 mg disponibles.'}],
    refDosis:[{via:'Oral',nino:'3–6 mg/kg/día (carga: 6 mg/kg)',adulto:'100–200 mg (fija)',freq:'1 vez/día · 7–14 días'}]
  },
  miconazol:{
    cat:'antifung', name:'Miconazol', desc:'Antifúngico · Gel oral · Local',
    mech:'Inhibe síntesis de ergosterol · Activo vs Candida y algunos gram positivos · Aplicación local en mucosa',
    ind:'Candidiasis oral localizada (parches blancos), queilitis angular, prótesis mucosa. Aplicación directa.',
    alerts:['warning:Interacción significativa con warfarina incluso en gel oral. Consultar.','info:Aplicar directamente sobre la lesión después de las comidas.'],
    vias:{
      oral:{ freq:'4 veces al día · 7–14 días · Después de las comidas',
        formatos:[
          {name:'Gel oral 20 mg/ml',conc:20,per:1,resUnit:'ml',tag:'solucion',label:'20 mg/ml · aplicación local · tubo 40g'},
        ],
        dosisNino:{min:5,max:10,maxDia:120},
        dosisAdulto:{fixed:true,min:5,max:10}},
    },
    refAlerts:[{t:'warning',m:'Interacción con warfarina incluso vía tópica oral. Verificar.'},{t:'info',m:'Aplicar sobre la lesión con dedo o hisopo después de comer.'}],
    refDosis:[{via:'Gel oral',nino:'5–10 ml/dosis (< 2 años: 2,5 ml)',adulto:'5–10 ml (fija)',freq:'4 veces/día · 7–14 días'}]
  },
  clotrimazol:{
    cat:'antifung', name:'Clotrimazol', desc:'Antifúngico · Uso local',
    mech:'Inhibe síntesis de ergosterol · Fungicida a concentraciones altas · Uso tópico oral y labial',
    ind:'Candidiasis oral localizada, queilitis angular por Candida. Comprimidos bucales o crema labial.',
    alerts:['info:Uso principalmente local. Absorción sistémica mínima.','info:Comprimidos bucales: dejar disolver lentamente en la boca, no masticar ni tragar.'],
    vias:{
      oral:{ freq:'5 veces al día (disolver en boca) · 14 días',
        formatos:[
          {name:'Comp. bucal 10 mg',conc:10,per:1,resUnit:'comp',tag:'comprimido',label:'10 mg · disolver en boca'},
          {name:'Crema 1%',conc:10,per:1,resUnit:'aplicaciones',tag:'solucion',label:'1% crema · uso labial/comisuras'},
        ],
        dosisNino:{min:10,max:10,maxDia:50},
        dosisAdulto:{fixed:true,min:10,max:10}},
    },
    refAlerts:[{t:'info',m:'Comprimidos bucales: disolver lentamente en boca, no masticar.'},{t:'info',m:'Absorción sistémica mínima: muy seguro.'}],
    refDosis:[{via:'Bucal',nino:'10 mg (1 comp.) · disolver en boca',adulto:'10 mg (fija)',freq:'5 veces/día · 14 días'}]
  },
  /* ══════ NUEVOS: GASTROPROTECTORES ══════ */
  omeprazol:{
    cat:'gastro', name:'Omeprazol', desc:'Inhibidor bomba de protones',
    mech:'Inhibidor irreversible de la bomba H+/K+ ATPasa · Reduce secreción de ácido gástrico',
    ind:'Protección gástrica al usar AINEs (ibuprofeno, diclofenaco, ketorolaco). Úlcera péptica asociada.',
    alerts:['info:Tomar 30 min ANTES del desayuno para máxima eficacia.','warning:Interacción con clopidogrel: reducción del efecto antiagregante.'],
    vias:{
      oral:{ freq:'1 vez al día · 30 min antes del desayuno',
        formatos:[
          {name:'Cápsula 20 mg',conc:20,per:1,resUnit:'cápsulas',tag:'capsula',label:'20 mg/cáps · genérico ✓'},
          {name:'Cápsula 40 mg',conc:40,per:1,resUnit:'cápsulas',tag:'capsula',label:'40 mg/cáps · Losec, Nexiam'},
        ],
        dosisNino:{min:0.7,max:1,maxDia:40},
        dosisAdulto:{fixed:true,min:20,max:40}},
    },
    refAlerts:[{t:'info',m:'Tomar 30 min antes del desayuno para máxima eficacia.'},{t:'warning',m:'Reduce efecto de clopidogrel. Interacción importante.'}],
    refDosis:[{via:'Oral',nino:'0,7–1 mg/kg/día (máx 40 mg)',adulto:'20–40 mg (fija)',freq:'1 vez/día · 30 min antes desayuno'}]
  }
};


const CATS = {
  analg:['paracetamol','ibuprofeno','diclofenaco','ketorolaco','naproxeno','clonixinato','ketoprofeno','dexketoprofeno','meloxicam','celecoxib','aspirina','metamizol'],
  cort:['dexametasona','metilprednisolona','prednisona','betametasona'],
  opio:['tramadol','tramadolParacetamol','codeina'],
  atb:['amoxicilina','amoxiClav','penicilinaG','metronidazol','claritromicina','azitromicina','clindamicina','eritromicina','doxiciclina','ciprofloxacino'],
  antiviral:['aciclovir','valaciclovir'],
  antifung:['nistatina','fluconazol','miconazol','clotrimazol'],
  gastro:['omeprazol','metoclopramida']
};
const CAT_COLOR = { analg:'cat-analg', cort:'cat-otros', opio:'cat-otros', atb:'cat-atb', antiviral:'cat-otros', antifung:'cat-otros', gastro:'cat-otros' };
const CAT_NAMES = { analg:'Analg.', cort:'Cort.', opio:'Opio.', atb:'ATB', antiviral:'Antiv.', antifung:'Antif.', gastro:'Gastro' };


// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
let selMed=null, selVia=null, selFmt=null;

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
function init(){
  renderSidebarNav();
  renderRefList();
}

// ════════════════════════════════════════════════════════════
//  TIPO PACIENTE BUTTONS
// ════════════════════════════════════════════════════════════
let tipoPacValue = '';

function selectTipo(tipo) {
  tipoPacValue = tipo;
  document.getElementById('tipo-nino').classList.toggle('selected', tipo === 'nino');
  document.getElementById('tipo-adulto').classList.toggle('selected', tipo === 'adulto');
}
const ACC_CONFIG = [
  {
    key: 'analg',
    label: 'Analgésicos / AINE',
    icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    iconCls: 'acc-icon-analg',
    dotCls: 'sri-analg'
  },
  {
    key: 'cort',
    label: 'Corticoides',
    icon: `<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/></svg>`,
    iconCls: 'acc-icon-analg',
    dotCls: 'sri-analg'
  },
  {
    key: 'opio',
    label: 'Opioides / Analgesia potente',
    icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>`,
    iconCls: 'acc-icon-otros',
    dotCls: 'sri-otros'
  },
  {
    key: 'atb',
    label: 'Antibióticos',
    icon: `<svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.51 15.49 0 12.36 0c-1.64 0-3.09.66-4.16 1.73L12 5.57V6H4C2.9 6 2 6.9 2 8v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 10l-4-4h3V8h2v4h3l-4 4z"/></svg>`,
    iconCls: 'acc-icon-atb',
    dotCls: 'sri-atb'
  },
  {
    key: 'antiviral',
    label: 'Antivirales',
    icon: `<svg viewBox="0 0 24 24"><path d="M13 2.05V4h2v2h-2v1.05C16.95 7.56 20 10.42 20 14c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-3.58 3.05-6.44 7-6.95V7H11V5h2V2.05h-1V2h1v.05zM13 9v6h-2V9h2z"/></svg>`,
    iconCls: 'acc-icon-otros',
    dotCls: 'sri-otros'
  },
  {
    key: 'antifung',
    label: 'Antifúngicos',
    icon: `<svg viewBox="0 0 24 24"><path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z"/></svg>`,
    iconCls: 'acc-icon-atb',
    dotCls: 'sri-atb'
  },
  {
    key: 'gastro',
    label: 'Gastroprotectores / Otros',
    icon: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
    iconCls: 'acc-icon-otros',
    dotCls: 'sri-otros'
  }
];

// Which accordion groups are open (by key)
let openAccordions = new Set(['analg']); // start with first open

function renderSidebarNav(filter='') {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  const q = filter.trim().toLowerCase();

  // ── SEARCH MODE: flat list, no accordion ──
  if (q) {
    const allKeys = Object.values(CATS).flat();
    const results = allKeys.filter(k =>
      MEDS[k].name.toLowerCase().includes(q) ||
      MEDS[k].desc.toLowerCase().includes(q)
    );
    if (!results.length) {
      nav.innerHTML = `<div style="padding:20px 20px;font-size:12px;color:rgba(255,255,255,0.3);text-align:center">Sin resultados</div>`;
      return;
    }
    const catOf = k => Object.entries(CATS).find(([,arr])=>arr.includes(k))?.[0]||'gastro';
    results.forEach(k => {
      const m = MEDS[k];
      const cat = catOf(k);
      const cfg = ACC_CONFIG.find(c=>c.key===cat);
      const item = document.createElement('div');
      item.className = 'search-result-item' + (selMed===k?' active':'');
      item.id = 'snav_' + k;
      item.innerHTML = `
        <div class="sri-dot ${cfg?cfg.dotCls:'sri-otros'}"></div>
        <div>
          <div class="nav-item-text">${m.name}</div>
          <div class="nav-item-sub">${m.desc}</div>
        </div>`;
      item.onclick = () => { selectMed(k); showTab('calc'); };
      nav.appendChild(item);
    });
    return;
  }

  // ── ACCORDION MODE ──
  ACC_CONFIG.forEach(cfg => {
    const keys = CATS[cfg.key];
    const isOpen = openAccordions.has(cfg.key);

    const group = document.createElement('div');
    group.className = 'acc-group';
    group.innerHTML = `
      <button class="acc-trigger${isOpen?' open':''}" id="acc-btn-${cfg.key}" onclick="toggleAccordion('${cfg.key}')">
        <div class="acc-icon ${cfg.iconCls}">${cfg.icon}</div>
        <div class="acc-label-wrap">
          <div class="acc-label-title">${cfg.label}</div>
          <div class="acc-label-count">${keys.length} medicamento${keys.length!==1?'s':''}</div>
        </div>
        <div class="acc-arrow">
          <svg viewBox="0 0 12 12"><polyline points="2,4 6,8 10,4"/></svg>
        </div>
      </button>
      <div class="acc-panel${isOpen?' open':''}" id="acc-panel-${cfg.key}">
        ${keys.map(k => {
          const m = MEDS[k];
          return `<div class="nav-item${selMed===k?' active':''}" id="snav_${k}" onclick="selectMed('${k}');showTab('calc')">
            <div>
              <div class="nav-item-text">${m.name}</div>
              <div class="nav-item-sub">${m.desc}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    nav.appendChild(group);
  });
}

function toggleAccordion(key) {
  const wasOpen = openAccordions.has(key);

  // Close all others (single-open behaviour)
  openAccordions.clear();

  // If it was closed, open it; if it was open, leave all closed (toggle)
  if (!wasOpen) openAccordions.add(key);

  // Update DOM without full re-render (smooth)
  ACC_CONFIG.forEach(cfg => {
    const btn   = document.getElementById('acc-btn-'   + cfg.key);
    const panel = document.getElementById('acc-panel-' + cfg.key);
    if (!btn || !panel) return;
    const open = openAccordions.has(cfg.key);
    btn.classList.toggle('open', open);
    panel.classList.toggle('open', open);
  });
}

function filterSidebarNav(v) { renderSidebarNav(v); }

// ════════════════════════════════════════════════════════════
//  CALC MED GRID
// ════════════════════════════════════════════════════════════
const CAT_DISPLAY_NAMES = {
  analg:'Analgésicos / AINE',
  cort:'Corticoides',
  opio:'Opioides / Analgesia potente',
  atb:'Antibióticos',
  antiviral:'Antivirales',
  antifung:'Antifúngicos',
  gastro:'Gastroprotectores / Otros'
};

function renderCalcMedGrid(){
  const container = document.getElementById('calcMedGrid');
  container.innerHTML = '';
  Object.entries(CATS).forEach(([cat, keys]) => {
    const label = document.createElement('div');
    label.className = 'cat-label';
    label.textContent = CAT_DISPLAY_NAMES[cat] || cat;
    container.appendChild(label);
    const grid = document.createElement('div');
    grid.className = 'med-grid';
    keys.forEach(k => {
      const m = MEDS[k];
      const b = document.createElement('div');
      b.className = 'med-btn' + (selMed===k?' selected':'');
      b.id = 'cmb_' + k;
      b.innerHTML = `<div class="med-btn-name">${m.name}</div><div class="med-btn-desc">${m.desc}</div>`;
      b.onclick = () => selectMed(k);
      grid.appendChild(b);
    });
    container.appendChild(grid);
  });
}

// ════════════════════════════════════════════════════════════
//  SELECT MED
// ════════════════════════════════════════════════════════════
function selectMed(key){
  selMed=key; selVia=null; selFmt=null;
  // Update sidebar nav active state
  document.querySelectorAll('.nav-item, .search-result-item').forEach(b=>b.classList.remove('active'));
  const nb=document.getElementById('snav_'+key); if(nb) nb.classList.add('active');
  // Ensure the correct accordion group is open
  const catOf = k => Object.entries(CATS).find(([,arr])=>arr.includes(k))?.[0]||'gastro';
  const cat = catOf(key);
  if(!openAccordions.has(cat) && !document.getElementById('sidebarSearch').value){
    openAccordions.clear(); openAccordions.add(cat);
    ACC_CONFIG.forEach(cfg=>{
      const btn=document.getElementById('acc-btn-'+cfg.key);
      const panel=document.getElementById('acc-panel-'+cfg.key);
      if(!btn||!panel) return;
      const open=openAccordions.has(cfg.key);
      btn.classList.toggle('open',open); panel.classList.toggle('open',open);
    });
  }
  const m=MEDS[key];
  document.getElementById('medInfoName').textContent=m.name;
  document.getElementById('medInfoMech').textContent=m.mech;
  document.getElementById('medInfoStrip').classList.add('visible');
  document.getElementById('selectedBadge').textContent=m.name;
  document.getElementById('selectedBadge').classList.add('visible');
  renderVias();
  document.getElementById('fmtGrid').innerHTML='<div class="empty-state"><div class="empty-state-text">Selecciona una vía primero</div></div>';
  document.getElementById('resultCard').classList.remove('visible');
}

// ════════════════════════════════════════════════════════════
//  VIAS
// ════════════════════════════════════════════════════════════
function renderVias(){
  const g=document.getElementById('viaGrid'); g.innerHTML='';
  Object.keys(MEDS[selMed].vias).forEach(v=>{
    const b=document.createElement('div'); b.className='via-btn'; b.id='vb_'+v;
    b.innerHTML=`<div class="via-name">${VL[v]||v}</div><div class="via-sub">${VS[v]||''}</div>`;
    b.onclick=()=>selectVia(v); g.appendChild(b);
  });
}

function selectVia(v){
  selVia=v; selFmt=null;
  document.querySelectorAll('.via-btn').forEach(b=>b.classList.remove('selected'));
  const vb=document.getElementById('vb_'+v); if(vb) vb.classList.add('selected');
  renderFormatos();
  document.getElementById('resultCard').classList.remove('visible');
}

// ════════════════════════════════════════════════════════════
//  FORMATOS
// ════════════════════════════════════════════════════════════
function renderFormatos(){
  const g=document.getElementById('fmtGrid'); g.innerHTML='';
  MEDS[selMed].vias[selVia].formatos.forEach((f,i)=>{
    const b=document.createElement('div'); b.className='fmt-btn';
    const lines=f.label.split('\n');
    b.innerHTML=`<div class="fmt-name">${f.name}</div><div class="fmt-conc">${lines.join('<br>')}</div><span class="fmt-tag tag-${f.tag}">${TL[f.tag]||f.tag}</span>`;
    b.onclick=()=>{
      selFmt=i;
      document.querySelectorAll('.fmt-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
    };
    g.appendChild(b);
  });
}

// ════════════════════════════════════════════════════════════
//  CALCULATE
// ════════════════════════════════════════════════════════════
function calcular(){
  const peso=parseFloat(document.getElementById('peso').value);
  const tipo=tipoPacValue;
  if(!selMed){alert('Selecciona un medicamento desde el panel izquierdo.'); return;}
  if(!peso||peso<=0){alert('Ingresa el peso del paciente.'); return;}
  if(!tipo){alert('Selecciona el tipo de paciente: Niño o Adulto.'); return;}
  if(!selVia){alert('Selecciona una vía de administración.'); return;}
  if(selFmt===null){alert('Selecciona el formato del medicamento.'); return;}

  const viaData=MEDS[selMed].vias[selVia];
  const fmt=viaData.formatos[selFmt];
  const dosis=tipo==='nino'?viaData.dosisNino:viaData.dosisAdulto;
  const esUI=!!(dosis.esUI);
  const isPorDia=!!(dosis.porDia&&tipo==='nino');
  const tomas=dosis.tomas||3;

  let minMg,maxMg,steps=[],stepsTitle='Pasos del cálculo';

  if(dosis.fixed){
    minMg=dosis.min; maxMg=dosis.max;
    steps.push(['Dosis fija (mín)',fN(minMg,esUI)+' / toma']);
    steps.push(['Dosis fija (máx)',fN(maxMg,esUI)+' / toma']);
  } else if(isPorDia){
    stepsTitle=`Cálculo mg/kg/DÍA ÷ ${tomas} tomas`;
    const dMin=peso*dosis.min, dMax=peso*dosis.max;
    const maxD=dosis.maxDia||999999;
    const dMinR=Math.min(dMin,maxD), dMaxR=Math.min(dMax,maxD);
    minMg=dMinR/tomas; maxMg=dMaxR/tomas;
    steps.push([`${peso} kg × ${fN(dosis.min,esUI)}/kg/día`,fN(dMin,esUI)+' mg/día']);
    if(dMin!==dMinR) steps.push(['Límite máx. diario (mín)',fN(dMinR,esUI)+' mg/día']);
    steps.push([`${peso} kg × ${fN(dosis.max,esUI)}/kg/día`,fN(dMax,esUI)+' mg/día']);
    if(dMax!==dMaxR) steps.push(['Límite máx. diario (máx)',fN(dMaxR,esUI)+' mg/día']);
    steps.push([`Dosis mín ÷ ${tomas} tomas`,fN(minMg,esUI)+' / toma']);
    steps.push([`Dosis máx ÷ ${tomas} tomas`,fN(maxMg,esUI)+' / toma']);
  } else {
    minMg=peso*dosis.min; maxMg=peso*dosis.max;
    if(dosis.maxDosis){minMg=Math.min(minMg,dosis.maxDosis); maxMg=Math.min(maxMg,dosis.maxDosis);}
    if(dosis.maxDia){minMg=Math.min(minMg,dosis.maxDia); maxMg=Math.min(maxMg,dosis.maxDia);}
    steps.push([`${peso} kg × ${fN(dosis.min,esUI)}/kg`,fN(minMg,esUI)+' / toma']);
    steps.push([`${peso} kg × ${fN(dosis.max,esUI)}/kg`,fN(maxMg,esUI)+' / toma']);
  }

  const isGtt=fmt.resUnit==='gotas';
  const isUI=fmt.resUnit==='UI';
  let minDisp,maxDisp,dispUnit;

  if(isUI){
    minDisp=(minMg/fmt.conc).toFixed(2); maxDisp=(maxMg/fmt.conc).toFixed(2); dispUnit='ampollas';
    steps.push([`${fN(minMg,true)} ÷ ${fN(fmt.conc,true)}/amp`,minDisp+' amp (mín)']);
    steps.push([`${fN(maxMg,true)} ÷ ${fN(fmt.conc,true)}/amp`,maxDisp+' amp (máx)']);
  } else if(isGtt&&fmt.gttFactor){
    minDisp=((minMg*fmt.gttFactor)/fmt.conc).toFixed(1); maxDisp=((maxMg*fmt.gttFactor)/fmt.conc).toFixed(1); dispUnit='gotas';
    steps.push([`${minMg.toFixed(2)} mg × ${fmt.gttFactor} gtt ÷ ${fmt.conc} mg`,minDisp+' gtt (mín)']);
    steps.push([`${maxMg.toFixed(2)} mg × ${fmt.gttFactor} gtt ÷ ${fmt.conc} mg`,maxDisp+' gtt (máx)']);
  } else if(isGtt){
    minDisp=(minMg/fmt.conc).toFixed(1); maxDisp=(maxMg/fmt.conc).toFixed(1); dispUnit='gotas';
    steps.push([`${minMg.toFixed(2)} mg ÷ ${fmt.conc} mg/gota`,minDisp+' gotas (mín)']);
    steps.push([`${maxMg.toFixed(2)} mg ÷ ${fmt.conc} mg/gota`,maxDisp+' gotas (máx)']);
  } else if(fmt.resUnit==='ml'){
    minDisp=((minMg*fmt.per)/fmt.conc).toFixed(2); maxDisp=((maxMg*fmt.per)/fmt.conc).toFixed(2); dispUnit='ml';
    steps.push([`${minMg.toFixed(1)} mg × ${fmt.per} ml ÷ ${fmt.conc} mg`,minDisp+' ml (mín)']);
    steps.push([`${maxMg.toFixed(1)} mg × ${fmt.per} ml ÷ ${fmt.conc} mg`,maxDisp+' ml (máx)']);
  } else {
    minDisp=((minMg*fmt.per)/fmt.conc).toFixed(2); maxDisp=((maxMg*fmt.per)/fmt.conc).toFixed(2); dispUnit=fmt.resUnit;
    steps.push([`${fN(minMg,esUI)} ÷ ${fN(fmt.conc,esUI)}/u`,minDisp+' '+fmt.resUnit+' (mín)']);
    steps.push([`${fN(maxMg,esUI)} ÷ ${fN(fmt.conc,esUI)}/u`,maxDisp+' '+fmt.resUnit+' (máx)']);
  }

  // DOSE BLOCKS
  const dr=document.getElementById('doseRow');
  const minLbl=esUI?fN(minMg,true):minMg.toFixed(0)+' mg';
  const maxLbl=esUI?fN(maxMg,true):maxMg.toFixed(0)+' mg';
  if(minMg===maxMg){
    dr.innerHTML=`<div class="dose-block single"><div class="dose-block-label">Dosis / toma</div><div class="dose-block-mg">${minLbl}</div><div class="dose-block-unit">≈ ${minDisp} ${dispUnit} / toma</div></div>`;
  } else {
    dr.innerHTML=`
      <div class="dose-block min"><div class="dose-block-label">Dosis mínima / toma</div><div class="dose-block-mg">${minLbl}</div><div class="dose-block-unit">≈ ${minDisp} ${dispUnit} / toma</div></div>
      <div class="dose-block max"><div class="dose-block-label">Dosis máxima / toma</div><div class="dose-block-mg">${maxLbl}</div><div class="dose-block-unit">≈ ${maxDisp} ${dispUnit} / toma</div></div>`;
  }

  // ALERTS
  const az=document.getElementById('alertZone'); az.innerHTML='';
  const med=MEDS[selMed];
  med.alerts.forEach(a=>{const[t,m]=a.split(':'); az.innerHTML+=aH(t,t==='danger'?'!':t==='warning'?'▲':'i',m);});
  if(tipo==='nino'&&peso<5) az.innerHTML+=aH('danger','!','Peso muy bajo. Verificar dosis con especialista pediátrico antes de administrar.');
  if(minMg===maxMg) az.innerHTML+=aH('ok','✓','Dosis dentro del rango terapéutico estándar.');
  else if(maxMg/minMg>=2) az.innerHTML+=aH('warning','▲','Rango amplio. Iniciar con dosis mínima y ajustar según respuesta clínica.');
  else az.innerHTML+=aH('ok','✓','Dosis dentro del rango terapéutico estándar.');

  document.getElementById('resFreq').textContent=viaData.freq;
  document.getElementById('stepsTitle').textContent=stepsTitle;
  document.getElementById('stepsContainer').innerHTML=steps.map(([l,v])=>`<div class="step-row"><span class="step-label">${l}</span><span class="step-val">${v}</span></div>`).join('');
  document.getElementById('resTitle').textContent=`${med.name} · Vía ${VL[selVia]||selVia}`;
  document.getElementById('resSub').textContent=`Paciente ${tipo==='nino'?'pediátrico':'adulto'} · ${peso} kg · ${TL[fmt.tag]||''} ${fmt.name}`;
  document.getElementById('resultCard').classList.add('visible');
  document.getElementById('resultCard').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ════════════════════════════════════════════════════════════
//  REFERENCE LIST
// ════════════════════════════════════════════════════════════
const NUM_COLOR=['#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12','#0a3d2e','#185fa5'];
const NUM_BG  =['#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7','#e1f5ee','#e6f1fb'];

function renderRefList(filter=''){
  const el=document.getElementById('refList'); el.innerHTML='';
  let allKeys=Object.values(CATS).flat();
  if(filter) allKeys=allKeys.filter(k=>
    MEDS[k].name.toLowerCase().includes(filter.toLowerCase())||
    MEDS[k].mech.toLowerCase().includes(filter.toLowerCase())||
    MEDS[k].ind.toLowerCase().includes(filter.toLowerCase())
  );
  allKeys.forEach((k,idx)=>{
    const m=MEDS[k];
    const catOf2 = k => Object.entries(CATS).find(([,arr])=>arr.includes(k))?.[0]||'gastro';
    const cat2 = catOf2(k);
    const catLabel = CAT_DISPLAY_NAMES[cat2]||cat2;
    const catCls = (cat2==='analg'||cat2==='cort')?'pill-green':cat2==='atb'?'pill-blue':'pill-amber';
    const card=document.createElement('div'); card.className='med-ref-card'; card.id='ref_'+k;
    card.innerHTML=`
      <div class="med-ref-header" onclick="toggleRef('${k}')">
        <div class="med-ref-header-left">
          <div class="med-ref-num" style="background:${NUM_BG[idx]};color:${NUM_COLOR[idx]}">${idx+1}</div>
          <div>
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px">
              <span class="med-ref-name">${m.name}</span>
              <span class="pill ${catCls}">${catLabel}</span>
            </div>
            <div class="med-ref-mech">${m.mech}</div>
          </div>
        </div>
        <div class="med-ref-arrow">⌄</div>
      </div>
      <div class="med-ref-body">
        <div class="ref-section-title">Indicación</div>
        <p style="font-size:13px;color:#555;margin-bottom:4px">${m.ind}</p>
        ${m.refAlerts.map(a=>`<div class="ref-alert ${a.t}"><b>${a.t==='danger'?'🚫':a.t==='warning'?'⚠️':'ℹ️'}</b> ${a.m}</div>`).join('')}
        <div class="ref-section-title">Dosis</div>
        <table class="ref-table">
          <tr><th>Vía</th><th>Niño</th><th>Adulto</th><th>Frecuencia</th></tr>
          ${m.refDosis.map(d=>`<tr><td>${d.via}</td><td>${d.nino}</td><td>${d.adulto}</td><td>${d.freq}</td></tr>`).join('')}
        </table>
        <div class="ref-section-title">Formatos disponibles en Chile</div>
        <table class="ref-table">
          <tr><th>Formato</th><th>Concentración</th></tr>
          ${Object.values(m.vias).flatMap(v=>v.formatos).map(f=>`<tr><td><span class="fmt-tag tag-${f.tag}" style="font-size:10px">${TL[f.tag]}</span></td><td style="font-family:'DM Mono',monospace;font-size:12px">${f.label.split('\n')[0]}</td></tr>`).join('')}
        </table>
        <div style="margin-top:14px">
          <button onclick="goCalc('${k}')" style="background:var(--green-900);color:#e8f5ee;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
            Calcular dosis →
          </button>
        </div>
      </div>`;
    el.appendChild(card);
  });
  if(!allKeys.length) el.innerHTML='<div class="empty-state" style="padding:48px"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No se encontraron resultados</div></div>';
}

function toggleRef(k){
  const card=document.getElementById('ref_'+k);
  card.classList.toggle('open');
}

function filterRef(v){ renderRefList(v); }

function goCalc(k){
  selectMed(k);
  showTab('calc');
  document.querySelector('.content-area').scrollIntoView({behavior:'smooth'});
}

// ════════════════════════════════════════════════════════════
//  TABS — Navegación entre paneles principales
// ════════════════════════════════════════════════════════════
function showTab(tab){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.topbar-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('panel-'+tab).classList.add('active');
  // Mapeo de tab → índice del botón en el topbar
  const idx={calc:0,admin:1,formulas:2}[tab];
  if(idx!==undefined) document.querySelectorAll('.topbar-tab')[idx].classList.add('active');
  const titles={
    calc:'Calculadora de Dosis',
    admin:'Administrar Medicamentos',
    formulas:'Fórmulas de Cálculo',
    form: editandoKey ? 'Editar medicamento' : 'Agregar medicamento'
  };
  document.getElementById('topbarTitle').textContent=titles[tab]||'DosisClínica';
  // Renderizar lista admin cada vez que se abre
  if(tab==='admin') renderAdminList();
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function fN(n,esUI){
  if(esUI) return n.toLocaleString('es-CL')+' UI';
  if(Number.isInteger(n)) return n.toString();
  return n.toFixed(n<1?3:1);
}
function aH(type,icon,msg){
  return `<div class="alert ${type}"><div class="alert-icon">${icon}</div><div class="alert-text">${msg}</div></div>`;
}

// ════════════════════════════════════════════════════════════
//  INIT — Punto de entrada de la aplicación
// ════════════════════════════════════════════════════════════
function init(){
  cargarMedsCustom();   // Cargar medicamentos guardados en localStorage
  renderSidebarNav();
  renderAdminList();
}


// ════════════════════════════════════════════════════════════
//  ADMINISTRAR — localStorage, lista, editar, eliminar, agregar
// ════════════════════════════════════════════════════════════

/* ── Clave de almacenamiento en localStorage ── */
const LS_KEY = 'dosisclinica_custom_meds';

/* ── Clave del medicamento siendo editado (null = modo agregar) ── */
let editandoKey = null;

/* ── Clave pendiente de eliminar ── */
let eliminandoKey = null;

/* ── Contador para IDs únicos de medicamentos nuevos ── */
let customIdCounter = Date.now();

/**
 * Carga los medicamentos guardados en localStorage
 * y los fusiona en el objeto MEDS global.
 */
function cargarMedsCustom() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const customs = JSON.parse(raw);
    Object.entries(customs).forEach(([key, med]) => {
      MEDS[key] = med;
      // Agregar a su categoría si no está
      const cat = med.cat;
      if (CATS[cat] && !CATS[cat].includes(key)) {
        CATS[cat].push(key);
      }
    });
  } catch(e) {
    console.warn('Error cargando medicamentos custom:', e);
  }
}

/**
 * Guarda en localStorage solo los medicamentos que fueron
 * creados o modificados por el usuario (los que tienen _custom:true).
 */
function guardarEnStorage() {
  const customs = {};
  Object.entries(MEDS).forEach(([key, med]) => {
    if (med._custom) customs[key] = med;
  });
  localStorage.setItem(LS_KEY, JSON.stringify(customs));
}

/**
 * Renderiza la lista completa de medicamentos en el panel Administrar.
 * Cada fila tiene botón Editar y Eliminar.
 */
function renderAdminList(filter = '') {
  const el = document.getElementById('adminList');
  if (!el) return;
  el.innerHTML = '';

  const q = filter.trim().toLowerCase();
  const allKeys = Object.values(CATS).flat();
  const filtered = q
    ? allKeys.filter(k => MEDS[k] && (
        MEDS[k].name.toLowerCase().includes(q) ||
        MEDS[k].desc.toLowerCase().includes(q)
      ))
    : allKeys;

  // Actualizar subtítulo con conteo
  const sub = document.getElementById('adminSubtitle');
  if (sub) sub.textContent = `${allKeys.length} medicamentos · Edita, elimina o agrega nuevos`;

  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state" style="padding:48px"><div class="empty-state-text">No se encontraron resultados</div></div>';
    return;
  }

  filtered.forEach((key, idx) => {
    const m = MEDS[key];
    if (!m) return;
    const row = document.createElement('div');
    row.className = 'admin-med-row';

    // Color del número de orden (rota por la paleta)
    const colors = ['#0a3d2e','#185fa5','#534ab7','#854f0b','#7a2e12'];
    const bgs    = ['#e1f5ee','#e6f1fb','#eeedfe','#faeeda','#faece7'];
    const ci = idx % 5;

    row.innerHTML = `
      <div class="admin-med-num" style="background:${bgs[ci]};color:${colors[ci]}">${idx+1}</div>
      <div class="admin-med-info">
        <div class="admin-med-name">
          ${m.name}
          ${m._custom ? '<span style="font-size:9px;background:var(--green-50);color:var(--green-700);padding:2px 6px;border-radius:20px;font-weight:600;margin-left:6px;font-family:DM Mono,monospace">CUSTOM</span>' : ''}
        </div>
        <div class="admin-med-meta">${m.desc} · ${CAT_DISPLAY_NAMES[m.cat]||m.cat}</div>
      </div>
      <div class="admin-med-actions">
        <button class="btn-edit" onclick="abrirFormulario('${key}')">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          Editar
        </button>
        <button class="btn-delete" onclick="pedirEliminar('${key}')">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Eliminar
        </button>
      </div>`;
    el.appendChild(row);
  });
}

/** Filtra la lista admin en tiempo real */
function filterAdmin(v) { renderAdminList(v); }

// ── MODAL DE ELIMINACIÓN ──

/**
 * Muestra el modal de confirmación antes de eliminar.
 */
function pedirEliminar(key) {
  eliminandoKey = key;
  const m = MEDS[key];
  document.getElementById('deleteModalMsg').textContent =
    `¿Seguro que deseas eliminar "${m ? m.name : key}"? Esta acción no se puede deshacer.`;
  document.getElementById('deleteModal').classList.add('visible');
}

function cerrarModal() {
  eliminandoKey = null;
  document.getElementById('deleteModal').classList.remove('visible');
}

/**
 * Elimina el medicamento del objeto MEDS, de CATS,
 * y del localStorage si era custom.
 */
function confirmarEliminar() {
  if (!eliminandoKey) return;
  const key = eliminandoKey;
  const nombre = MEDS[key] ? MEDS[key].name : key;

  // Quitar de CATS
  Object.keys(CATS).forEach(cat => {
    CATS[cat] = CATS[cat].filter(k => k !== key);
  });

  // Quitar de MEDS
  delete MEDS[key];

  // Actualizar localStorage
  guardarEnStorage();

  cerrarModal();
  renderAdminList();
  renderSidebarNav();
  mostrarToast(`"${nombre}" eliminado correctamente`);
}

// ── FORMULARIO ──

/**
 * Abre el formulario de creación o edición.
 * @param {string|null} key - key del med a editar, o null para crear nuevo
 */
function abrirFormulario(key) {
  editandoKey = key;
  limpiarFormulario();

  if (key && MEDS[key]) {
    // Modo edición: rellenar el formulario con los datos existentes
    const m = MEDS[key];
    document.getElementById('f-name').value   = m.name || '';
    document.getElementById('f-cat').value    = m.cat  || '';
    document.getElementById('f-desc').value   = m.desc || '';
    document.getElementById('f-mech').value   = m.mech || '';
    document.getElementById('f-ind').value    = m.ind  || '';

    // Alertas
    (m.alerts || []).forEach(a => {
      const parts = a.split(':');
      const tipo = parts[0];
      const msg  = parts.slice(1).join(':');
      agregarAlerta(tipo, msg);
    });

    // Vías
    if (m.vias) {
      const oral = m.vias.oral;
      if (oral) {
        document.getElementById('f-oral-freq').value = oral.freq || '';
        const dn = oral.dosisNino || {};
        document.getElementById('f-oral-nino-min').value = dn.min ?? '';
        document.getElementById('f-oral-nino-max').value = dn.max ?? '';
        if (dn.porDia) {
          document.getElementById('f-oral-nino-pordia').value = 'si';
          toggleTomasField('oral');
          document.getElementById('f-oral-nino-tomas').value = dn.tomas || 3;
        }
        document.getElementById('f-oral-nino-maxdia').value = dn.maxDia || '';
        const da = oral.dosisAdulto || {};
        document.getElementById('f-oral-adulto-tipo').value = da.fixed ? 'fixed' : 'perkilo';
        document.getElementById('f-oral-adulto-min').value = da.min ?? '';
        document.getElementById('f-oral-adulto-max').value = da.max ?? '';
        (oral.formatos || []).forEach(f => agregarFormato('oral', f));
      }
      const rectal = m.vias.rectal;
      if (rectal) {
        document.getElementById('f-rectal-freq').value = rectal.freq || '';
        const dr = rectal.dosisNino || {};
        document.getElementById('f-rectal-nino-min').value = dr.min ?? '';
        document.getElementById('f-rectal-nino-max').value = dr.max ?? '';
        const dar = rectal.dosisAdulto || {};
        document.getElementById('f-rectal-adulto-min').value = dar.min ?? '';
        document.getElementById('f-rectal-adulto-max').value = dar.max ?? '';
        (rectal.formatos || []).forEach(f => agregarFormato('rectal', f));
      }
      const ev = m.vias.endovenosa;
      if (ev) {
        document.getElementById('f-ev-freq').value = ev.freq || '';
        const de = ev.dosisNino || {};
        document.getElementById('f-ev-nino-min').value = de.min ?? '';
        document.getElementById('f-ev-nino-max').value = de.max ?? '';
        const dae = ev.dosisAdulto || {};
        document.getElementById('f-ev-adulto-min').value = dae.min ?? '';
        document.getElementById('f-ev-adulto-max').value = dae.max ?? '';
        (ev.formatos || []).forEach(f => agregarFormato('ev', f));
      }
    }
    document.getElementById('formPanelTitle').textContent = 'Editar medicamento';
  } else {
    // Modo agregar: formulario vacío con una alerta y un formato por defecto
    agregarAlerta();
    agregarFormato('oral');
    document.getElementById('formPanelTitle').textContent = 'Agregar medicamento';
  }

  showTab('form');
}

/** Limpia todos los campos del formulario */
function limpiarFormulario() {
  ['f-name','f-cat','f-desc','f-mech','f-ind',
   'f-oral-freq','f-oral-nino-min','f-oral-nino-max',
   'f-oral-nino-maxdia','f-oral-adulto-min','f-oral-adulto-max',
   'f-rectal-freq','f-rectal-nino-min','f-rectal-nino-max',
   'f-rectal-adulto-min','f-rectal-adulto-max',
   'f-ev-freq','f-ev-nino-min','f-ev-nino-max',
   'f-ev-adulto-min','f-ev-adulto-max'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-oral-nino-pordia').value = 'no';
  document.getElementById('f-oral-adulto-tipo').value = 'fixed';
  toggleTomasField('oral');
  document.getElementById('alertsContainer').innerHTML   = '';
  document.getElementById('oral-formatos-container').innerHTML  = '';
  document.getElementById('rectal-formatos-container').innerHTML = '';
  document.getElementById('ev-formatos-container').innerHTML    = '';
}

/** Muestra/oculta el campo de N° tomas según selección */
function toggleTomasField(via) {
  const sel   = document.getElementById(`f-${via}-nino-pordia`);
  const group = document.getElementById(`f-${via}-tomas-group`);
  if (!sel || !group) return;
  group.style.display = sel.value === 'si' ? 'flex' : 'none';
  group.style.flexDirection = 'column';
  group.style.gap = '6px';
}

/** Agrega una fila de alerta al formulario */
function agregarAlerta(tipo = 'warning', msg = '') {
  const c = document.getElementById('alertsContainer');
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = `
    <select class="form-select" style="max-width:130px;flex-shrink:0">
      <option value="info"    ${tipo==='info'   ?'selected':''}>ℹ️ Info</option>
      <option value="warning" ${tipo==='warning'?'selected':''}>⚠️ Advertencia</option>
      <option value="danger"  ${tipo==='danger' ?'selected':''}>🚫 Peligro</option>
    </select>
    <input class="form-input" type="text" placeholder="Texto de la alerta..." value="${msg.replace(/"/g,'&quot;')}">
    <button class="btn-remove-row" onclick="this.parentElement.remove()" title="Eliminar">×</button>`;
  c.appendChild(row);
}

/**
 * Agrega un bloque de formato al contenedor de la vía indicada.
 * @param {string} via - 'oral' | 'rectal' | 'ev'
 * @param {object|null} datos - datos a prerellenar (en modo edición)
 */
function agregarFormato(via, datos = null) {
  const containerId = via === 'ev' ? 'ev-formatos-container' : `${via}-formatos-container`;
  const c = document.getElementById(containerId);
  if (!c) return;

  const n = datos || {};
  const block = document.createElement('div');
  block.className = 'formato-block';

  // Opciones de tag de formato
  const tagOpts = Object.entries(TL).map(([v,l]) =>
    `<option value="${v}" ${n.tag===v?'selected':''}>${l}</option>`
  ).join('');

  block.innerHTML = `
    <div class="formato-block-title">
      Formato
      <button class="btn-remove-row" style="width:24px;height:24px;font-size:13px" onclick="this.closest('.formato-block').remove()" title="Eliminar">×</button>
    </div>
    <div class="form-row" style="margin-bottom:8px">
      <div class="form-group">
        <label class="form-label" style="font-weight:400">Nombre del formato</label>
        <input class="form-input fmt-name" type="text" placeholder="Ej: Jarabe 120 mg/5ml" value="${n.name||''}">
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:400">Tipo</label>
        <select class="form-select fmt-tag">${tagOpts}</select>
      </div>
    </div>
    <div class="form-row" style="margin-bottom:8px">
      <div class="form-group">
        <label class="form-label" style="font-weight:400">Concentración (mg)</label>
        <input class="form-input fmt-conc" type="number" placeholder="Ej: 120" step="0.001" value="${n.conc||''}">
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:400">Volumen por medida (ml)</label>
        <input class="form-input fmt-per" type="number" placeholder="Ej: 5 (para 120mg/5ml)" step="0.1" value="${n.per||1}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" style="font-weight:400">Unidad de resultado</label>
        <select class="form-select fmt-unit">
          <option value="ml"          ${n.resUnit==='ml'          ?'selected':''}>ml</option>
          <option value="comp"        ${n.resUnit==='comp'        ?'selected':''}>comprimidos</option>
          <option value="cápsulas"    ${n.resUnit==='cápsulas'    ?'selected':''}>cápsulas</option>
          <option value="supositorios"${n.resUnit==='supositorios'?'selected':''}>supositorios</option>
          <option value="gotas"       ${n.resUnit==='gotas'       ?'selected':''}>gotas</option>
          <option value="UI"          ${n.resUnit==='UI'          ?'selected':''}>UI</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:400">Factor gotas/ml (si aplica)</label>
        <input class="form-input fmt-gtt" type="number" placeholder="Ej: 30" step="1" value="${n.gttFactor||''}">
      </div>
    </div>
    <div class="form-group" style="margin-top:8px">
      <label class="form-label" style="font-weight:400">Etiqueta/descripción</label>
      <input class="form-input fmt-label" type="text" placeholder="Ej: 120 mg/5 ml · Kitadol" value="${n.label||''}">
    </div>`;

  c.appendChild(block);
}

/**
 * Lee los formatos de un contenedor de vía y los devuelve como array.
 */
function leerFormatos(containerId) {
  const c = document.getElementById(containerId);
  if (!c) return [];
  const formatos = [];
  c.querySelectorAll('.formato-block').forEach(block => {
    const conc    = parseFloat(block.querySelector('.fmt-conc')?.value);
    const per     = parseFloat(block.querySelector('.fmt-per')?.value) || 1;
    const name    = block.querySelector('.fmt-name')?.value.trim();
    const tag     = block.querySelector('.fmt-tag')?.value;
    const resUnit = block.querySelector('.fmt-unit')?.value;
    const label   = block.querySelector('.fmt-label')?.value.trim();
    const gtt     = parseFloat(block.querySelector('.fmt-gtt')?.value);
    if (!name || !conc) return;
    const f = { name, conc, per, resUnit, tag, label: label || name };
    if (gtt) f.gttFactor = gtt;
    formatos.push(f);
  });
  return formatos;
}

/**
 * Lee y valida todos los campos del formulario,
 * construye el objeto medicamento y lo guarda.
 */
function guardarMedicamento() {
  // ── Validaciones básicas ──
  const name = document.getElementById('f-name').value.trim();
  const cat  = document.getElementById('f-cat').value;
  const desc = document.getElementById('f-desc').value.trim();
  const mech = document.getElementById('f-mech').value.trim();
  const ind  = document.getElementById('f-ind').value.trim();

  if (!name) { alert('El nombre del medicamento es obligatorio.'); return; }
  if (!cat)  { alert('Debes seleccionar una categoría.'); return; }
  if (!desc) { alert('La descripción corta es obligatoria.'); return; }
  if (!mech) { alert('El mecanismo de acción es obligatorio.'); return; }
  if (!ind)  { alert('La indicación clínica es obligatoria.'); return; }

  // ── Alertas ──
  const alerts = [];
  document.getElementById('alertsContainer').querySelectorAll('.dynamic-row').forEach(row => {
    const tipo = row.querySelector('select')?.value;
    const msg  = row.querySelector('input')?.value.trim();
    if (tipo && msg) alerts.push(`${tipo}:${msg}`);
  });

  // ── Vías ──
  const vias = {};

  // Vía oral (obligatoria si tiene formatos)
  const oralFormatos = leerFormatos('oral-formatos-container');
  const oralFreq = document.getElementById('f-oral-freq').value.trim();
  const oralNinoMin = parseFloat(document.getElementById('f-oral-nino-min').value);
  const oralNinoMax = parseFloat(document.getElementById('f-oral-nino-max').value);
  if (oralFormatos.length > 0) {
    const porDia = document.getElementById('f-oral-nino-pordia').value === 'si';
    const dosisNino = { min: oralNinoMin||0, max: oralNinoMax||0 };
    if (porDia) {
      dosisNino.porDia = true;
      dosisNino.tomas  = parseInt(document.getElementById('f-oral-nino-tomas')?.value)||3;
    }
    const maxDia = parseFloat(document.getElementById('f-oral-nino-maxdia').value);
    if (maxDia) dosisNino.maxDia = maxDia;

    const adultoTipo = document.getElementById('f-oral-adulto-tipo').value;
    const adultoMin  = parseFloat(document.getElementById('f-oral-adulto-min').value)||0;
    const adultoMax  = parseFloat(document.getElementById('f-oral-adulto-max').value)||0;
    const dosisAdulto = adultoTipo === 'fixed'
      ? { fixed: true, min: adultoMin, max: adultoMax }
      : { min: adultoMin, max: adultoMax };

    vias.oral = { freq: oralFreq, formatos: oralFormatos, dosisNino, dosisAdulto };
  }

  // Vía rectal (opcional)
  const rectalFormatos = leerFormatos('rectal-formatos-container');
  const rectalFreq = document.getElementById('f-rectal-freq').value.trim();
  if (rectalFormatos.length > 0 || rectalFreq) {
    vias.rectal = {
      freq: rectalFreq,
      formatos: rectalFormatos,
      dosisNino: {
        min: parseFloat(document.getElementById('f-rectal-nino-min').value)||0,
        max: parseFloat(document.getElementById('f-rectal-nino-max').value)||0
      },
      dosisAdulto: {
        min: parseFloat(document.getElementById('f-rectal-adulto-min').value)||0,
        max: parseFloat(document.getElementById('f-rectal-adulto-max').value)||0
      }
    };
  }

  // Vía endovenosa (opcional)
  const evFormatos = leerFormatos('ev-formatos-container');
  const evFreq = document.getElementById('f-ev-freq').value.trim();
  if (evFormatos.length > 0 || evFreq) {
    vias.endovenosa = {
      freq: evFreq,
      formatos: evFormatos,
      dosisNino: {
        min: parseFloat(document.getElementById('f-ev-nino-min').value)||0,
        max: parseFloat(document.getElementById('f-ev-nino-max').value)||0
      },
      dosisAdulto: {
        fixed: true,
        min: parseFloat(document.getElementById('f-ev-adulto-min').value)||0,
        max: parseFloat(document.getElementById('f-ev-adulto-max').value)||0
      }
    };
  }

  if (Object.keys(vias).length === 0) {
    alert('Debes agregar al menos una vía de administración con al menos un formato.');
    return;
  }

  // ── Construir objeto medicamento ──
  const med = {
    cat, name, desc, mech, ind,
    alerts,
    vias,
    _custom: true,       // Marca como medicamento personalizado
    refAlerts: alerts.map(a => {
      const [t, ...rest] = a.split(':');
      return { t, m: rest.join(':') };
    }),
    refDosis: Object.entries(vias).map(([via, vd]) => ({
      via: VL[via] || via,
      nino:   `${vd.dosisNino?.min ?? '—'}–${vd.dosisNino?.max ?? '—'} mg/kg`,
      adulto: `${vd.dosisAdulto?.min ?? '—'}–${vd.dosisAdulto?.max ?? '—'} mg`,
      freq:   vd.freq || '—'
    }))
  };

  // ── Determinar la key del medicamento ──
  let key = editandoKey;
  if (!key) {
    // Generar key única a partir del nombre
    key = 'custom_' + name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      + '_' + (++customIdCounter);
  }

  // ── Guardar en MEDS ──
  const catCambiada = editandoKey && MEDS[editandoKey] && MEDS[editandoKey].cat !== cat;
  if (catCambiada) {
    // Si cambió de categoría, quitar de la categoría anterior
    const catAnterior = MEDS[editandoKey].cat;
    CATS[catAnterior] = CATS[catAnterior].filter(k => k !== key);
  }
  MEDS[key] = med;

  // Agregar a CATS si es nuevo o cambió categoría
  if (!editandoKey || catCambiada) {
    if (CATS[cat] && !CATS[cat].includes(key)) {
      CATS[cat].push(key);
    }
  }

  // ── Persistir en localStorage ──
  guardarEnStorage();

  // ── Refrescar UI ──
  renderSidebarNav();
  editandoKey = null;
  showTab('admin');
  mostrarToast(`"${name}" guardado correctamente ✓`);
}

// ── TOAST ──

let toastTimer = null;

/**
 * Muestra un mensaje flotante de confirmación por 3 segundos.
 */
function mostrarToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 3000);
}

// ── Arrancar ──
init();
