// Colección oficial de cromos LALIGA 2026-27 (Panini) — Checklist 3ª edición.
// Transcrito del PDF oficial «Checklist LALIGA 2026-27 3ED», en el mismo orden que el listado.
//
// Formato de cada línea: "número|nombre|posición|edición|estado"
//   · edición: "2" (cromo añadido en la 2ª edición) o "3" (añadido en la 3ª). Vacío = edición original.
//   · estado:  "x" = cromo RETIRADO (en rojo en el checklist: el jugador desaparece del álbum).
//              Se muestra tachado, no se puede marcar y no cuenta en el total.
// Los huecos sin nombre en el listado oficial se muestran como "Sin nombre".
//
// Cromos A/B (p. ej. 6A y 6B): son alternativas del mismo hueco, solo cuenta UNO por equipo.
// Se calculan solos a partir de los números (ver `alternativas` más abajo); si uno de los dos
// está retirado, el otro pasa a ser un cromo normal.
//
// El id de cada cromo es `${seccion.id}-${numero}` y es lo que se guarda en la base de datos:
// NO cambies ids ni números de cromos existentes o se perderá lo marcado.

const RAW = [
  {
    id: 'alaves', nombre: 'Deportivo Alavés', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Quique Sánchez Flores|entrenador', '3|Sivera|portero', '4|Adrián Rodríguez|portero|3',
      '5|Jonny|defensa', '6|Koski|defensa', '7|Tenaglia|defensa', '8|Parada|defensa||x',
      '8BIS|Garcés|defensa|3', '9|Yusi|defensa', '10|Mikel Rodríguez|medio|3', '11|Benavidez|medio',
      '12|Blanco|medio', '13|Guevara|medio', '14|Aleñá|medio', '15|Pablo Ibáñez|medio',
      '16|Denis Suárez|medio', '17|Ángel Pérez|delantero', '18A|Abde|delantero', '18B|Mañas|delantero',
      '19|Toni Martínez|delantero', '20|Boyé|delantero', '20BIS|Mariano|delantero|3',
    ],
  },
  {
    id: 'athletic', nombre: 'Athletic Club de Bilbao', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Edin Terzic|entrenador', '3|Unai Simón|portero', '4|Padilla|portero',
      '5|Areso|defensa', '6A|Paredes|defensa', '6B|Yeray|defensa', '7|Vivian|defensa', '8|Laporte|defensa',
      '9A|Yuri|defensa', '9B|Adama Boiro|defensa', '10|Jauregizar|medio', '11|Ruiz de Galarreta|medio',
      '12|Rego|medio', '13|Unai Gómez|medio||x', '13BIS|Prados|medio|2', '14|Sancet|medio',
      '15|Nico Serrano|medio', '16|Berenguer|delantero', '17A|Robert Navarro|delantero',
      '17B|Maroan|delantero', '18|Nico Williams|delantero', '19|Williams|delantero',
      '20|Guruzeta|delantero',
    ],
  },
  {
    id: 'atletico', nombre: 'Atlético de Madrid', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Cholo Simeone|entrenador', '3|Oblak|portero', '4|Musso|portero',
      '5|Marcos Llorente|defensa', '6|Nahuel Molina|defensa||x', '7|Pubill|defensa',
      '8A|Le Normand|defensa', '8B|Giménez|defensa', '9|Hancko|defensa', '10|Ruggeri|defensa||x',
      '10BIS|Grimaldo|defensa|3', '11|Koke|medio', '12|Barrios|medio', '13|Johnny Cardoso|medio',
      '14A|Rodri Mendoza|medio', '14B|Obed Vargas|medio', '15|Álex Baena|medio', '16|Almada|medio||x',
      '16BIS|Arnau Ortiz|delantero|3', '17|Giuliano|delantero', '18|Lookman|delantero',
      '19|Sorloth|delantero', '20|Julián Alvarez|delantero',
    ],
  },
  {
    id: 'barcelona', nombre: 'FC Barcelona', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Hansi Flick|entrenador', '3|Joan García|portero', '4|Szczesny|portero',
      '5|Koundé|defensa', '6A|Araujo|defensa||x', '6B|Christensen|defensa', '7|Cubarsí|defensa',
      '8|Gerard Martín|defensa', '9|Joao Cancelo|defensa', '10|Balde|defensa', '11|Eric García|defensa',
      '12|De Jong|medio', '13|Gavi|medio', '14|Bernal|medio', '15|Pedri|medio', '16|Fermín|medio',
      '17|Dani Olmo|delantero', '18|Ferran Torres|delantero||x', '18BIS|Abdelkarim|delantero|3',
      '19|Raphinha|delantero', '20|Lamine Yamal|delantero',
    ],
  },
  {
    id: 'betis', nombre: 'Real Betis', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Manuel Pellegrini|entrenador', '3|Valles|portero', '4|Pau López|portero||x',
      '4BIS|Diego Conde|portero|2', '5A|Aitor Ruibal|defensa', '5B|Bellerín|defensa',
      '6|Diego Llorente|defensa', '7|Bartra|defensa', '8|Natan|defensa', '9|Valentín Gómez|defensa',
      '10|Marc Roca|medio', '11|Amrabat|medio||x', '11BIS|Deossa|medio|3', '12|Fidalgo|medio',
      '13|Facundo Bernal|medio|2', '14|Lo Celso|medio', '15|Pablo Fornals|medio', '16|Isco|medio',
      '17|Riquelme|delantero', '18|Antony|delantero', '19|Cucho Hernández|delantero', '20|Abde|delantero',
    ],
  },
  {
    id: 'celta', nombre: 'RC Celta de Vigo', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Claudio Giráldez|entrenador', '3|Radu|portero', '4|Iván Villar|portero',
      '5|Álvaro Núñez|defensa', '6|Javi Rueda|defensa', '7|Javi Rodríguez|defensa', '8|Starfelt|defensa',
      '9A|Marcos Alonso|defensa', '9B|Yoel Lago|defensa', '10|Carreira|defensa', '11|Ilaix Moriba|medio',
      '12|Miguel Román|medio', '13|Hugo Álvarez|medio', '14|Sotelo|medio||x', '14BIS|Vecino|medio|2|x',
      '15|Fer López|medio||x', '16|Swedberg|medio', '17|Iago Aspas|delantero', '18A|Pablo Durán|delantero',
      '18B|El-Abdellaoui|delantero', '19|Jutglà|delantero', '19BIS|Hugo González|delantero|3',
      '20|Borja Iglesias|delantero',
    ],
  },
  {
    id: 'deportivo', nombre: 'Deportivo', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Antonio Hidalgo|entrenador', '3|Álvaro Fernández|portero', '4|Germán Parreño|portero',
      '5|Adrià Altimira|defensa', '6|Loureiro|defensa', '7|Noubi|defensa', '8|Dani Barcia|defensa',
      '8BIS|Bright Ede|defensa|3', '9A|Ximo Navarro|defensa', '9B|Arnau Comas|defensa',
      '10|Quagliata|defensa', '11|Villares|medio', '12|Riki|medio', '13|Mario Soriano|medio',
      '14|José Ángel|medio', '14BIS|Gijselhat|medio|3', '15|Luismi Cruz|medio', '16|Mella|medio',
      '17|Asp Jensen|delantero|3', '18|Yeremay|delantero', '19|Eddahchouri|delantero',
      '20|Nsongo|delantero',
    ],
  },
  {
    id: 'elche', nombre: 'Elche CF', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Martín Anselmi|entrenador|2', '3|Dituro|portero', '4|Iturbe|portero|2',
      '5|Pétrot|defensa||x', '6|Chust|defensa', '7|Bigas|defensa', '8|Affengruber|defensa',
      '9A|Pedrosa|defensa||x', '9B|Sangaré|defensa', '10|Germán Valera|medio', '11|Martim Neto|medio',
      '12|Gonzalo Villar|medio', '13A|Fede Redondo|medio', '13B|Jon Chetauya|medio||x',
      '14|Marc Aguado|medio', '15|Josan|medio', '16|Morente|medio', '17|Ali Houary|delantero|2',
      '18|Cepeda|delantero', '19|Diangana|delantero', '20|Yago Santiago|delantero',
    ],
  },
  {
    id: 'espanyol', nombre: 'RCD Espanyol', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Manolo González|entrenador', '3|Dmitrovic|portero', '4|Fortuño|portero',
      '5|El Hilali|defensa', '6|Rubén Sánchez|defensa', '6BIS|Drkusic|defensa|3', '7|Riedel|defensa',
      '8|Cabrera|defensa', '9|Miguel Rubio|defensa||x', '9BIS|Hinojo|defensa|3', '10|Hartman|defensa|2',
      '11|Pol Lozano|medio', '12|Urko|medio', '13|Edu Expósito|medio', '14|Jofre|medio',
      '15|Marcos Fernández|delantero|2', '15BIS|Javi Hernández|delantero|3', '16|Dolan|delantero',
      '17|Pere Milla|delantero', '18|Puado|delantero', '19|Kike García|delantero',
      '20|Roberto Fernández|delantero',
    ],
  },
  {
    id: 'getafe', nombre: 'Getafe CF', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Jose Bordalás|entrenador', '3|David Soria|portero', '4|Letacek|portero',
      '5|Kiko Femenía|defensa', '6|Djené|defensa', '7|Boselli|defensa', '8|Abqar|defensa',
      '9|Zaid Romero|defensa', '10|Davinchi|defensa', '11|Mario Martín|medio', '12|Javi Muñoz|medio||x',
      '13|Francho|medio|3', '14|Terrats|medio|2', '15|Mangala|medio|3', '16|Juanmi|delantero|2',
      '17|Álex Sancris|delantero||x', '18|Borja Mayoral|delantero', '19|Luis Vázquez|delantero||x',
      '19BIS|Ünal|delantero|3', '20|Satriano|delantero',
    ],
  },
  {
    id: 'levante', nombre: 'Levante UD', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Luís Castro|entrenador', '3|Ryan|portero', '4|Pablo Campos|portero',
      '5|Toljan|defensa', '6|Elgezabal|defensa||x', '6BIS|Nacho Pérez|defensa|3', '7|Dela|defensa',
      '8|Mandi|defensa|2', '9|Manu Sánchez|defensa', '10|Arriaga|medio||x', '11|Oriol Rey|medio',
      '12|Olasagasti|medio', '13|Dani Requena|medio|2', '14A|Victor García|medio', '14B|Paco Cortés|medio',
      '15|Carlos Álvarez|medio', '16|Tunde|delantero||x', '16BIS|Thiago Fernández|delantero|3',
      '17|Brugué|delantero', '18|Iván Romero|delantero', '19|Etta Eyong|delantero',
      '20|Carlos Espí|delantero||x', '20BIS|Musuayi|delantero|2',
    ],
  },
  {
    id: 'realmadrid', nombre: 'Real Madrid CF', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|José Mourinho|entrenador', '3|Courtois|portero', '4|Lunin|portero', '5|Trent|defensa',
      '6|Militao|defensa', '7|Asencio|defensa', '7BIS|Konaté|defensa|3', '8|Rüdiger|defensa',
      '9|Huijsen|defensa', '10A|Carreras|defensa', '10B|Mendy|defensa', '11|Tchouaméni|medio',
      '12|Fede Valverde|medio', '13|Camavinga|medio', '14|Bellingham|medio', '15A|Güler|medio',
      '15B|Thiago Pitarch|medio', '16A|Mastantuono|medio||x', '16B|Brahim Díaz|delantero',
      '17|Gonzalo|delantero||x', '17BIS|Carlos Espí|delantero|2', '18|Rodrygo|delantero',
      '19|Vinícius|delantero', '20|Mbappé|delantero',
    ],
  },
  {
    id: 'malaga', nombre: 'Málaga CF', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Juan Francisco Funes|entrenador', '3|Alfonso Herrero|portero',
      '4|Carlos López|portero', '5|Puga|defensa', '6|Murillo|defensa', '6BIS|Recio|defensa|3',
      '7|Calero|defensa|2', '8|Einar Galilea|defensa', '9|Rafita|defensa', '10|Salinas|defensa|2',
      '11|Izan Mérino|medio', '12|Dani Lorenzo|medio', '13A|Rafa Rodríguez|medio', '13B|Juanpe|medio||x',
      '14|Dotor|medio', '15|Aarón Ochoa|medio', '16|Larrubia|delantero', '17|Lobete|delantero',
      '18|Adrián Niño|delantero', '19|Joaquín|delantero', '20|Chupe|delantero',
    ],
  },
  {
    id: 'osasuna', nombre: 'Osasuna', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Luis Miguel Ramis|entrenador', '3|Sergio Herrera|portero',
      '4|Aitor Fernández|portero', '5A|Rosier|defensa', '5B|Arguibide|defensa', '6|Boyomo|defensa',
      '7|Herrando|defensa', '8|Catena|defensa', '9|Abel Bretones|defensa', '10|Osambela|medio',
      '11|Torró|medio', '12|Moncayola|medio', '13A|Moi Gómez|medio', '13B|Iker Muñoz|medio',
      '14|Rubén García|medio', '15|Aimar Oroz|medio', '16|Iker Benito|medio', '16BIS|Dubasin|delantero|3',
      '17|Raúl Moro|delantero', '18|Raúl García|delantero', '19|Kike Barja|delantero',
      '20|Budimir|delantero',
    ],
  },
  {
    id: 'racing', nombre: 'Racing de Santander', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|José Alberto López|entrenador', '3|Agirrezabala|portero|3', '4|Eriksson|portero',
      '5|Mantilla|defensa', '6|Sangalli|defensa||x', '6BIS|Pablo Ramón|defensa|2',
      '7|Facu González|defensa', '8|Javi Castro|defensa||x', '8BIS|Pedro Felipe|defensa|3',
      '9A|Manu Hernando|defensa', '9B|Mario García|defensa||x', '10|Jorge Salinas|defensa',
      '11|Maguette|medio', '12|Gustavo Puerta|medio', '13|Íñigo|medio', '13BIS|Sergio Martínez|medio|3',
      '14|Aldasoro|medio||x', '15|Suleiman|delantero||x', '15BIS|Zabiri|delantero|3',
      '16|Andrés Martín|delantero', '17|Guliashvili|delantero', '18|Íñigo Vicente|delantero',
      '19|Arana|delantero', '20|Villalibre|delantero',
    ],
  },
  {
    id: 'rayo', nombre: 'Rayo Vallecano', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Beñat San José|entrenador', '3|Batalla|portero', '4|Cárdenas|portero',
      '5|Ratiu|defensa', '6|Balliu|defensa', '7|Nobel Mendy|defensa||x', '7BIS|Vertrouwd|defensa|3',
      '8|Lejeune|defensa', '9|Luiz Felipe|defensa', '10|Pep Chavarría|defensa||x',
      '10BIS|Pelayo|defensa|3', '11A|Pedro Díaz|medio', '11B|Nteka|medio', '12|Pathé Ciss|medio',
      '13|Óscar Valentín|medio', '14|Unai López|medio', '15|Isi|medio', '16|De Frutos|delantero',
      '17|Fran Pérez|delantero', '18|Álvaro García|delantero', '19|Camello|delantero',
      '20|Alemao|delantero',
    ],
  },
  {
    id: 'realsociedad', nombre: 'Real Sociedad', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Pellegrino Matarazzo|entrenador', '3|Remiro|portero', '4|Marrero|portero',
      '5|Aramburu|defensa', '6|Zubeldia|defensa', '7|Jon Martín|defensa', '8|Sergio Gómez|defensa',
      '9|Aihen Muñoz|defensa', '10|Gorrotxategi|medio', '11|Pablo Marín|medio', '12|Turrientes|medio',
      '13A|Yangel Herrera|medio', '13B|Zakharyan|medio|2', '14|Carlos Soler|medio', '15|Sucic|medio',
      '16|Barrenetxea|delantero', '17|Kubo|delantero', '18|Guedes|delantero', '19|Oskarsson|delantero',
      '20|Oyarzabal|delantero',
    ],
  },
  {
    id: 'sevilla', nombre: 'Sevilla', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Luis García|entrenador', '3|Vlachodimos|portero', '4|Fran González|portero|3',
      '5|Carmona|defensa', '6|Juanlu|defensa||x', '6BIS|Iglesias|defensa|2', '7|Kike Salas|defensa',
      '8|Nianzou|defensa||x', '8BIS|Julio Díaz|defensa|3', '9A|Castrín|defensa', '9B|Marcao|defensa',
      '10|Suazo|defensa', '11|Oso|medio||x', '12|Agoumé|medio', '13|Guridi|medio|2', '14|Sow|medio||x',
      '15|Vargas|medio', '16|Manu Bueno|medio', '17|Peque|delantero', '18|Ejuke|delantero',
      '19|Akor Adams|delantero||x', '19BIS|Miguel Sierra|delantero|3', '20|Isaac Romero|delantero',
    ],
  },
  {
    id: 'valencia', nombre: 'Valencia', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Carlos Corberán|entrenador', '3|Dimitrievski|portero', '4|Rivero|portero',
      '5|Foulquier|defensa', '6|Copete|defensa', '7|Tárrega|defensa', '8A|Cömert|defensa||x',
      '8B|Diakhaby|defensa', '9|Gayà|defensa', '10|Jesús Vázquez|defensa', '11|Pepelu|medio',
      '12|Guido Rodríguez|medio', '13|Javi Guerra|medio', '14|Luis Rioja|medio', '15|Ugrinic|medio',
      '16|André Almeida|medio', '16BIS|Dieng|medio|2', '17|Hugo Duro|delantero',
      '18|Diego López|delantero', '19|Ramazani|delantero||x', '19BIS|Danjuma|delantero|2',
      '20A|Sadiq|delantero', '20B|Lucas Beltrán|delantero||x',
    ],
  },
  {
    id: 'villarreal', nombre: 'Villarreal', grupo: 'equipos',
    cromos: [
      '1|Escudo', '2|Íñigo Pérez|entrenador', '3|Luiz Júnior|portero', '4|Arnau Tenas|portero||x',
      '4BIS|Gulácsi|portero|2', '5|Mouriño|defensa', '6A|Pau Navarro|defensa', '6B|Logan Costa|defensa',
      '7A|Foyth|defensa', '7B|Freeman|defensa', '8A|Kambwala|defensa||x', '8B|Rafa Marín|defensa||x',
      '9|Renato Veiga|defensa', '10|Sergi Cardona|defensa', '11|Pape Gueye|medio',
      '12|Santi Comesaña|medio', '13|Maciá|medio', '14|Moleiro|medio', '15|Buchanan|delantero',
      '16|Oluwaseyi|delantero', '17|Ayoze|delantero', '18|Pépé|delantero', '19|Mikautadze|delantero',
      '20|Gerard Moreno|delantero',
    ],
  },
  {
    id: 'fichajes', nombre: 'Últimos Fichajes', grupo: 'especiales',
    cromos: [
      'UF1|Canales (Racing de Santander)|medio|2', 'UF2|Calatrava (Espanyol)|medio|2',
      'UF3|Dumfries (Real Madrid)|defensa|2', 'UF4|Carlos Romero (Espanyol)|defensa|2',
      'UF5|Hjulmand (Atlético de Madrid)|medio|2', 'UF6|Fran García (Real Madrid)|defensa|2',
      'UF7|Bardelli (Levante)|medio|2', 'UF8|Leo Román (Deportivo)|portero|2',
      'UF9|De Haas (Valencia)|defensa|2', 'UF10|Febas (Celta)|medio|2',
      'UF11|Juan Cruz (Málaga)|delantero|2', 'UF12|Aubameyang (Deportivo)|delantero|2',
      'UF13|Sotelo (Celta)|medio|2', 'UF14|Sato (Valencia)|delantero|2',
      'UF15|Fer Niño (Elche)|delantero|2', 'UF16|Moscardó (Espanyol)|medio|2',
      'UF17|Sangante (Sevilla)|defensa|2', 'UF18|Andrés García (Getafe)|defensa|2',
      'UF19|Adeyemi (Barcelona)|delantero|2', 'UF20|Kang-In Lee (Atlético de Madrid)|medio|2',
      'UF21|Bernardo Silva (Real Madrid)|medio|3', 'UF22|Amatucci (Deportivo)|medio|3',
      'UF23|Mojica (Getafe)|defensa|3', 'UF24|Gordon (Barcelona)|delantero|3',
      'UF25|Robbie Ure (Sevilla)|delantero|3', 'UF26|Javi Morcillo (Sevilla)|medio|3',
      'UF27|Nuñez (Espanyol)|defensa|3', 'UF28|Maffeo (Valencia)|defensa|3',
      'UF29|Cucurella (Real Madrid)|defensa|3', 'UF30|Valentini (Alavés)|defensa|3',
      'UF31|Sazonov (Getafe)|defensa|3', 'UF32|Buonanotte (Elche)|medio|3',
      'UF33|Angeliño (Deportivo)|defensa|3', 'UF34|Iván Martín (Racing)|medio|3',
      'UF35|Peio Canales (Athletic)|medio|3', 'UF36|Kochorashvili (Sevilla)|medio|3',
      'UF37|Galán (Celta)|defensa|3', 'UF38|Parrott (Betis)|delantero|3',
      'UF39|Diomande (Real Madrid)|delantero|3', 'UF40|Rodri (Barcelona)|medio|3',
    ],
  },
  {
    id: 'adn', nombre: 'ADN / LALIGA Prime', grupo: 'especiales',
    cromos: [
      '1|Antony (Betis)|delantero', '2|Bellingham (Real Madrid)|medio', '3|Courtois (Real Madrid)|portero',
      '4|Fermín (Barcelona)|medio', '5|Julián Alvarez (Atlético)|delantero',
      '6|Lamine Yamal (Barcelona)|delantero', '7|Lookman (Atlético)|delantero',
      '8|Mbappé (Real Madrid)|delantero', '9|Moleiro (Villarreal)|medio',
      '10|Nico Williams (Athletic)|delantero', '11|Oyarzabal (Real Sociedad)|delantero',
      '12|Pedri (Barcelona)|medio', '13|Raphinha (Barcelona)|delantero', '14|Unai Simón (Athletic)|portero',
      '15|Vinícius (Real Madrid)|delantero',
    ],
  },
  {
    id: 'fantasy', nombre: 'LALIGA Fantasy', grupo: 'especiales',
    cromos: [
      '1|Hansi Flick (Barcelona)|entrenador', '2|Joan García (Barcelona)|portero',
      '3|Lejeune (Rayo Vallecano)|defensa', '4|Fornals (Betis)|medio', '5|Lamine Yamal (Barcelona)|delantero',
      '6|Luis Milla (Getafe)|medio', '7|Pedri (Barcelona)|medio', '8|Luis Milla (Getafe)|medio',
      '9|Mbappé (Real Madrid)|delantero',
    ],
  },
  {
    id: 'draft', nombre: 'Draft 23', grupo: 'especiales',
    cromos: [
      '1|Asencio (Real Madrid)|defensa', '2|Balde (Barcelona)|defensa', '3|Barrios (Atlético de Madrid)|medio',
      '4|Carlos Espí (Levante)|delantero', '5|Carreras (Real Madrid)|defensa', '6|Cubarsí (Barcelona)|defensa',
      '7|Fer López (Celta)|medio', '8|Gavi (Barcelona)|medio', '9|Gonzalo (Real Madrid)|delantero',
      '10|Huijsen (Real Madrid)|defensa', '11|Jauregizar (Athletic)|medio', '12|Javi Guerra (Valencia)|medio',
      '13|Jon Martín (Real Sociedad)|defensa', '14|Juanlu (Sevilla)|defensa', '15|Marc Bernal (Barcelona)|medio',
      '16|Mastantuono (Real Madrid)|medio', '17|Oso (Sevilla)|medio', '18|Pau Navarro (Villarreal)|defensa',
      '19|Pubill (Atlético de Madrid)|defensa', '20|Renato Veiga (Villarreal)|defensa',
      '21|Rodri Mendoza (Atlético de Madrid)|medio', '22|Thiago Pitarch (Real Madrid)|medio',
      '23|Yeremay (Deportivo)|delantero',
    ],
  },
  {
    id: 'kromix', nombre: 'Draft 23 Kromix', grupo: 'especiales',
    cromos: [
      'K1|Asencio (Real Madrid)|defensa', 'K2|Balde (Barcelona)|defensa', 'K3|Barrios (Atlético de Madrid)|medio',
      'K4|Carlos Espí (Levante)|delantero', 'K5|Carreras (Real Madrid)|defensa', 'K6|Cubarsí (Barcelona)|defensa',
      'K7|Fer López (Celta)|medio', 'K8|Gavi (Barcelona)|medio', 'K9|Gonzalo (Real Madrid)|delantero',
      'K10|Huijsen (Real Madrid)|defensa', 'K11|Jauregizar (Athletic)|medio', 'K12|Javi Guerra (Valencia)|medio',
      'K13|Jon Martín (Real Sociedad)|defensa', 'K14|Juanlu (Sevilla)|defensa', 'K15|Marc Bernal (Barcelona)|medio',
      'K16|Mastantuono (Real Madrid)|medio', 'K17|Oso (Sevilla)|medio', 'K18|Pau Navarro (Villarreal)|defensa',
      'K19|Pubill (Atlético de Madrid)|defensa', 'K20|Renato Veiga (Villarreal)|defensa',
      'K21|Rodri Mendoza (Atlético de Madrid)|medio', 'K22|Thiago Pitarch (Real Madrid)|medio',
      'K23|Yeremay (Deportivo)|delantero',
    ],
  },
  {
    id: 'bronce', nombre: 'Extra Sticker Bronce', grupo: 'especiales',
    cromos: [
      'B1|Lamine Yamal (Barcelona)|delantero', 'B2|Mbappé (Real Madrid)|delantero',
      'B3|Nico Williams (Athletic)|delantero', 'B4|Pedri (Barcelona)|medio', 'B5|Oblak (Atlético de Madrid)|portero',
    ],
  },
  {
    id: 'plata', nombre: 'Extra Sticker Plata', grupo: 'especiales',
    cromos: [
      'P1|Lamine Yamal (Barcelona)|delantero', 'P2|Mbappé (Real Madrid)|delantero',
      'P3|Nico Williams (Athletic)|delantero', 'P4|Pedri (Barcelona)|medio', 'P5|Oblak (Atlético de Madrid)|portero',
    ],
  },
  {
    id: 'oro', nombre: 'Extra Sticker Oro', grupo: 'especiales',
    cromos: [
      'O1|Lamine Yamal (Barcelona)|delantero', 'O2|Mbappé (Real Madrid)|delantero',
      'O3|Nico Williams (Athletic)|delantero', 'O4|Pedri (Barcelona)|medio', 'O5|Oblak (Atlético de Madrid)|portero',
    ],
  },
];

export const GRUPOS = [
  { id: 'equipos', nombre: 'Equipos' },
  { id: 'especiales', nombre: 'Especiales' },
];

export const SECCIONES = RAW.map((s) => {
  const cromos = s.cromos.map((linea) => {
    const [numero, nombre, posicion, ed, estado] = linea.split('|');
    return {
      id: `${s.id}-${numero}`,
      numero,
      nombre: nombre || 'Sin nombre',
      sinNombre: !nombre,
      posicion: posicion || '',
      edicion: ed === '2' ? 2 : ed === '3' ? 3 : 0,
      retirado: estado === 'x',
      alternativas: [], // ids de los cromos A/B que compiten por el mismo hueco
      grupoAB: '', // identificador del hueco A/B (vacío si el cromo no tiene alternativa)
    };
  });

  // Agrupa A/B por número. Los retirados no cuentan como alternativa.
  const porHueco = {};
  cromos.forEach((c) => {
    if (c.retirado) return;
    const m = c.numero.match(/^(\d+)[AB]$/);
    if (m) (porHueco[m[1]] = porHueco[m[1]] || []).push(c);
  });
  let huecosExtra = 0; // cromos que sobran por ser alternativas (cuenta solo 1 por hueco)
  Object.entries(porHueco).forEach(([hueco, grupo]) => {
    if (grupo.length < 2) return;
    huecosExtra += grupo.length - 1;
    grupo.forEach((c) => {
      c.grupoAB = `${s.id}-${hueco}`;
      c.alternativas = grupo.filter((o) => o !== c).map((o) => o.id);
    });
  });

  return {
    id: s.id,
    nombre: s.nombre,
    grupo: s.grupo,
    cromos,
    // Total real de la sección: sin retirados y con cada hueco A/B contado una sola vez
    total: cromos.filter((c) => !c.retirado).length - huecosExtra,
  };
});

export const TODOS_LOS_CROMOS = SECCIONES.flatMap((s) => s.cromos);
export const TOTAL_CROMOS = SECCIONES.reduce((acc, s) => acc + s.total, 0);
