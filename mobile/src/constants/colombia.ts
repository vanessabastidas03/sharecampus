export const CITIES_BY_DEPARTMENT: Record<string, string[]> = {
  'Bogotá D.C.': ['Bogotá'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'Rionegro', 'Caldas'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Buga'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo'],
  'Bolívar': ['Cartagena', 'Magangué'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales'],
  'Córdoba': ['Montería', 'Lorica'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón'],
  'Tolima': ['Ibagué', 'Espinal', 'Melgar'],
  'Caldas': ['Manizales', 'La Dorada', 'Riosucio'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'],
  'Quindío': ['Armenia', 'Calarcá', 'Montenegro'],
  'Cauca': ['Popayán', 'Santander de Quilichao'],
  'Meta': ['Villavicencio', 'Acacías'],
  'Cundinamarca': ['Soacha', 'Fusagasugá', 'Zipaquirá', 'Facatativá', 'Chía'],
  'Magdalena': ['Santa Marta', 'Ciénaga'],
  'Cesar': ['Valledupar', 'Aguachica'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona'],
  'Sucre': ['Sincelejo', 'Corozal'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso'],
  'Chocó': ['Quibdó'],
  'La Guajira': ['Riohacha'],
  'San Andrés y Providencia': ['San Andrés'],
  'Amazonas': ['Leticia'],
  'Putumayo': ['Mocoa'],
  'Guainía': ['Inírida'],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño'],
  'Casanare': ['Yopal'],
  'Arauca': ['Arauca'],
  'Caquetá': ['Florencia'],
  'Guaviare': ['San José del Guaviare'],
};

export const UNIVERSITIES: { name: string; city: string; department: string }[] = [
  // BOGOTÁ D.C.
  { name: 'Universidad Nacional de Colombia', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad de los Andes', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Pontificia Universidad Javeriana', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad del Rosario', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Externado de Colombia', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad de La Sabana', city: 'Chía', department: 'Cundinamarca' },
  { name: 'Universidad Distrital Francisco José de Caldas', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Central', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad El Bosque', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Santo Tomás (Bogotá)', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Sergio Arboleda', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad de La Salle', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Piloto de Colombia', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'UNIMINUTO (Bogotá)', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Militar Nueva Granada', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad EAN', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Jorge Tadeo Lozano', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Manuela Beltrán', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Antonio Nariño (Bogotá)', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad INCCA de Colombia', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Libre (Bogotá)', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Fundación Universidad América', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad de Ciencias Aplicadas y Ambientales (UDCA)', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Politécnico Grancolombiano', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Escuela Colombiana de Ingeniería Julio Garavito', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'UCC – Universitaria de Colombia', city: 'Bogotá', department: 'Bogotá D.C.' },
  { name: 'Universidad Cooperativa de Colombia (Bogotá)', city: 'Bogotá', department: 'Bogotá D.C.' },

  // ANTIOQUIA
  { name: 'Universidad de Antioquia', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad EAFIT', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad Pontificia Bolivariana (Medellín)', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad de Medellín', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad CES', city: 'Medellín', department: 'Antioquia' },
  { name: 'ITM - Instituto Tecnológico Metropolitano', city: 'Medellín', department: 'Antioquia' },
  { name: 'Politécnico Colombiano Jaime Isaza Cadavid', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad Autónoma Latinoamericana (UNAULA)', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad Cooperativa de Colombia (Medellín)', city: 'Medellín', department: 'Antioquia' },
  { name: 'CEIPA Business School', city: 'Sabaneta', department: 'Antioquia' },
  { name: 'Universidad Luis Amigó (FUNLAM)', city: 'Medellín', department: 'Antioquia' },
  { name: 'Institución Universitaria de Envigado', city: 'Envigado', department: 'Antioquia' },
  { name: 'Corporación Universitaria Lasallista', city: 'Caldas', department: 'Antioquia' },
  { name: 'Universidad Católica Luis Amigó', city: 'Medellín', department: 'Antioquia' },
  { name: 'Universidad de San Buenaventura (Medellín)', city: 'Medellín', department: 'Antioquia' },

  // VALLE DEL CAUCA
  { name: 'Universidad del Valle', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Pontificia Universidad Javeriana (Cali)', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Universidad Autónoma de Occidente', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Universidad ICESI', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Universidad Santiago de Cali', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Universidad San Buenaventura (Cali)', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Universidad Libre (Cali)', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Institución Universitaria Antonio José Camacho', city: 'Cali', department: 'Valle del Cauca' },
  { name: 'Universidad Cooperativa de Colombia (Cali)', city: 'Cali', department: 'Valle del Cauca' },

  // ATLÁNTICO / BARRANQUILLA
  { name: 'Universidad del Norte', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'Universidad del Atlántico', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'Corporación Universitaria de la Costa (CUC)', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'Corporación Universitaria Rafael Núñez (Barranquilla)', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'Universidad Cooperativa de Colombia (Barranquilla)', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'Universidad Libre (Barranquilla)', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'Universidad Simón Bolívar (Barranquilla)', city: 'Barranquilla', department: 'Atlántico' },
  { name: 'UNIMINUTO (Barranquilla)', city: 'Barranquilla', department: 'Atlántico' },

  // BOLÍVAR / CARTAGENA
  { name: 'Universidad de Cartagena', city: 'Cartagena', department: 'Bolívar' },
  { name: 'Universidad Tecnológica de Bolívar (UTB)', city: 'Cartagena', department: 'Bolívar' },
  { name: 'Corporación Universitaria Rafael Núñez (Cartagena)', city: 'Cartagena', department: 'Bolívar' },
  { name: 'Universidad de San Buenaventura (Cartagena)', city: 'Cartagena', department: 'Bolívar' },
  { name: 'Universidad Cooperativa de Colombia (Cartagena)', city: 'Cartagena', department: 'Bolívar' },
  { name: 'Unicolombo', city: 'Cartagena', department: 'Bolívar' },

  // SANTANDER / BUCARAMANGA
  { name: 'Universidad Industrial de Santander (UIS)', city: 'Bucaramanga', department: 'Santander' },
  { name: 'Universidad Autónoma de Bucaramanga (UNAB)', city: 'Bucaramanga', department: 'Santander' },
  { name: 'Universidad de Santander (UDES)', city: 'Bucaramanga', department: 'Santander' },
  { name: 'Universidad Pontificia Bolivariana (Bucaramanga)', city: 'Bucaramanga', department: 'Santander' },
  { name: 'Universidad Cooperativa de Colombia (Bucaramanga)', city: 'Bucaramanga', department: 'Santander' },
  { name: 'Universidad Santo Tomás (Bucaramanga)', city: 'Bucaramanga', department: 'Santander' },

  // EJE CAFETERO
  { name: 'Universidad de Caldas', city: 'Manizales', department: 'Caldas' },
  { name: 'Universidad de Manizales', city: 'Manizales', department: 'Caldas' },
  { name: 'Universidad Autónoma de Manizales', city: 'Manizales', department: 'Caldas' },
  { name: 'Universidad Tecnológica de Pereira (UTP)', city: 'Pereira', department: 'Risaralda' },
  { name: 'Universidad Libre (Pereira)', city: 'Pereira', department: 'Risaralda' },
  { name: 'Fundación Universitaria del Área Andina (Pereira)', city: 'Pereira', department: 'Risaralda' },
  { name: 'Universidad del Quindío', city: 'Armenia', department: 'Quindío' },
  { name: 'Universidad La Gran Colombia (Armenia)', city: 'Armenia', department: 'Quindío' },

  // NARIÑO
  { name: 'Universidad de Nariño (Pasto)', city: 'Pasto', department: 'Nariño' },
  { name: 'Universidad Mariana', city: 'Pasto', department: 'Nariño' },
  { name: 'Institución Universitaria CESMAG', city: 'Pasto', department: 'Nariño' },
  { name: 'Universidad Cooperativa de Colombia (Pasto)', city: 'Pasto', department: 'Nariño' },

  // HUILA / TOLIMA
  { name: 'Universidad Surcolombiana (Neiva)', city: 'Neiva', department: 'Huila' },
  { name: 'Corporación Universitaria del Huila (CORHUILA)', city: 'Neiva', department: 'Huila' },
  { name: 'Universidad del Tolima', city: 'Ibagué', department: 'Tolima' },
  { name: 'Universidad de Ibagué', city: 'Ibagué', department: 'Tolima' },

  // CAUCA
  { name: 'Universidad del Cauca (Popayán)', city: 'Popayán', department: 'Cauca' },
  { name: 'Corporación Universitaria Autónoma del Cauca', city: 'Popayán', department: 'Cauca' },

  // CÓRDOBA / SUCRE
  { name: 'Universidad de Córdoba (Montería)', city: 'Montería', department: 'Córdoba' },
  { name: 'Corporación Universitaria del Caribe (CECAR)', city: 'Sincelejo', department: 'Sucre' },
  { name: 'Universidad de Sucre', city: 'Sincelejo', department: 'Sucre' },

  // BOYACÁ / TUNJA
  { name: 'Universidad Pedagógica y Tecnológica de Colombia (UPTC)', city: 'Tunja', department: 'Boyacá' },
  { name: 'Universidad de Boyacá', city: 'Tunja', department: 'Boyacá' },
  { name: 'Fundación Universitaria Juan de Castellanos', city: 'Tunja', department: 'Boyacá' },

  // MAGDALENA / SANTA MARTA
  { name: 'Universidad del Magdalena', city: 'Santa Marta', department: 'Magdalena' },
  { name: 'Corporación Universitaria Rafael Núñez (Santa Marta)', city: 'Santa Marta', department: 'Magdalena' },

  // CESAR / VALLEDUPAR
  { name: 'Universidad Popular del Cesar', city: 'Valledupar', department: 'Cesar' },

  // NORTE DE SANTANDER / CÚCUTA
  { name: 'Universidad Francisco de Paula Santander', city: 'Cúcuta', department: 'Norte de Santander' },
  { name: 'Universidad Libre (Cúcuta)', city: 'Cúcuta', department: 'Norte de Santander' },
  { name: 'Universidad de Pamplona', city: 'Pamplona', department: 'Norte de Santander' },

  // LLANOS / META
  { name: 'Universidad de los Llanos (Villavicencio)', city: 'Villavicencio', department: 'Meta' },
  { name: 'Corporación Universitaria del Meta', city: 'Villavicencio', department: 'Meta' },

  // CHOCÓ
  { name: 'Universidad Tecnológica del Chocó', city: 'Quibdó', department: 'Chocó' },

  // AMAZONÍA
  { name: 'Universidad de la Amazonía (Florencia)', city: 'Florencia', department: 'Caquetá' },

  // MULTISEDE
  { name: 'UNIMINUTO (varias sedes)', city: '', department: '' },
  { name: 'Universidad Cooperativa de Colombia (varias sedes)', city: '', department: '' },
  { name: 'Universidad Antonio Nariño (varias sedes)', city: '', department: '' },
  { name: 'Otra universidad', city: '', department: '' },
];

export const UNIVERSITY_NAMES = UNIVERSITIES.map(u => u.name);

export const CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta',
  'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales',
  'Neiva', 'Villavicencio', 'Armenia', 'Montería', 'Sincelejo', 'Popayán',
  'Valledupar', 'Tunja', 'Florencia', 'Quibdó', 'Riohacha', 'San Andrés',
  'Leticia', 'Mocoa', 'Inírida', 'Mitú', 'Puerto Carreño', 'Yopal', 'Arauca',
  'Sabaneta', 'Chía', 'Bello', 'Itagüí', 'Envigado', 'Caldas',
];

export const DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada',
];
