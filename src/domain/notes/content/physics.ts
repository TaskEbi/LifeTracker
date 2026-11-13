/** Physics: Pearson Edexcel International A Level, AS units WPH11–WPH13. */
import { f, fig, h, ol, sec, tbl, tip, topic, trap, ul, type NoteSubject } from '../types';
import { PHYSICS_A2 } from './physics2';

const u1 = [
  topic(
    'ph-motion',
    'WPH11 · 1',
    'Motion in a Line',
    'Displacement, velocity, acceleration · the suvat equations · motion graphs · free fall',
    'Gradient gives the rate. Area gives the total.',
    [
      'Displacement: Distance in a given direction from a starting point (vector).',
      'Velocity: Rate of change of displacement (vector).',
      'Acceleration: Rate of change of velocity (vector).',
      'Free fall: Motion under gravity alone, a = g = 9.81 m s^{−2} downwards.',
    ],
    [
      sec(
        'The suvat equations',
        'They hold only when acceleration is **constant**. Pick a positive direction first and give every quantity a sign.',
        f('v = u + at', 's = ½(u + v)t', 's = ut + ½at^2', 'v^2 = u^2 + 2as'),
        'List the five quantities, mark the three you know and the one you want, then choose the equation without the fifth.',
        trap('A ball thrown upwards has a = −9.81 m s^{−2} the whole way, including at the top where v = 0. Its acceleration is never zero.'),
      ),
      sec(
        'Motion graphs',
        tbl(['Graph', 'Gradient', 'Area under'], ['Displacement–time', 'Velocity', '—'], ['Velocity–time', 'Acceleration', 'Displacement'], ['Acceleration–time', '—', 'Change in velocity']),
        fig('vt', 'Speeding up, steady, slowing down: the shaded area under a velocity–time graph is the displacement.'),
        'For a curve, the gradient at a point is the gradient of the **tangent** there. Average velocity is total displacement ÷ total time.',
      ),
      sec(
        'Free fall and measuring g',
        'With air resistance ignored, every object falls with the same acceleration g. Dropped from rest: s = ½gt^2, so a graph of s against t^2 is a straight line of gradient ½g.',
        tip('When asked why a measured g is too small, think of air resistance or a delay in the timing gate or electromagnet release, and say which way it shifts t.'),
      ),
    ],
  ),
  topic(
    'ph-vectors',
    'WPH11 · 1',
    'Vectors and Projectiles',
    'Scalars and vectors · resolving · adding by drawing or calculation · projectile motion',
    'Horizontal and vertical never talk to each other.',
    ['Scalar: Has magnitude only (speed, mass, energy, time).', 'Vector: Has magnitude and direction (velocity, force, momentum).', 'Resultant: The single vector with the same effect as several together.', 'Component: The part of a vector acting along a chosen direction.'],
    [
      sec(
        'Resolving and adding',
        'A vector F at angle θ to the horizontal splits into two perpendicular components:',
        f('F_x = F cos θ', 'F_y = F sin θ'),
        ul('Perpendicular vectors: resultant by Pythagoras, direction by tan θ = opposite ÷ adjacent.', 'Any other angle: resolve each into x and y, add the components, recombine. Or draw a scale diagram tip-to-tail.', 'Equilibrium: the vectors form a **closed triangle**, so the components in each direction sum to zero.'),
      ),
      sec(
        'Projectiles',
        'Treat the two directions separately. They share only the **time**.',
        tbl(['Direction', 'Acceleration', 'Use'], ['Horizontal', '0', 'x = u cos θ × t (constant velocity)'], ['Vertical', 'g downwards', 'suvat with u_y = u sin θ']),
        fig('projectile', 'The horizontal velocity stays the same; the vertical velocity changes by 9.81 m s⁻¹ every second.'),
        ol('Resolve the launch velocity.', 'Use the vertical motion to find the time (at the top v_y = 0; back at launch height s_y = 0).', 'Put that time into the horizontal motion for the range.'),
        trap('At the highest point the projectile is still moving: its speed is u cos θ, not zero.'),
      ),
    ],
  ),
  topic(
    'ph-forces',
    'WPH11 · 1',
    'Forces and Moments',
    "Newton's three laws · free-body diagrams · weight · moments · centre of gravity · equilibrium",
    'No resultant force, no change in velocity.',
    [
      'Resultant force: The vector sum of all forces on a body.',
      "Newton's first law: A body stays at rest or at constant velocity unless a resultant force acts.",
      'Moment: Force × perpendicular distance from the pivot to the line of action of the force.',
      'Centre of gravity: The point where the whole weight of a body appears to act.',
      'Equilibrium: No resultant force and no resultant moment.',
    ],
    [
      sec(
        "Newton's laws",
        f('ΣF = ma', 'W = mg'),
        ul('**First:** balanced forces mean constant velocity (which includes rest).', '**Second:** the resultant force equals mass × acceleration, in the direction of the resultant.', '**Third:** if A pushes B, B pushes A with a force equal in size, opposite in direction, of the **same type**, acting on the **other body**.'),
        trap('Weight and the normal contact force on a book are not a third-law pair: they act on the same object and are different types of force. The pair to the weight is the gravitational pull of the book on the Earth.'),
        'A free-body diagram shows one object and only the forces acting **on** it, each as a labelled arrow from where it acts.',
      ),
      sec(
        'Moments and equilibrium',
        f('moment = Fx', 'sum of clockwise moments = sum of anticlockwise moments'),
        fig('moments', 'A beam balances when the moments about the pivot are equal: a small force far out matches a large force close in.'),
        ul('x is the **perpendicular** distance from the pivot to the line of action.', 'Take moments about a point where an unknown force acts, so that force drops out.', "A uniform beam's weight acts at its midpoint."),
        tip('Equilibrium questions need both conditions: resolve forces (up = down, left = right) and take moments.'),
      ),
    ],
  ),
  topic(
    'ph-momentum',
    'WPH11 · 1',
    'Momentum',
    'p = mv · conservation of linear momentum in one dimension · link to Newton’s laws',
    'Total momentum before equals total momentum after.',
    ['Momentum: Mass × velocity; a vector, in kg m s^{−1} or N s.', 'Conservation of momentum: Total momentum of a system is constant if no external resultant force acts.', 'Closed system: One with no external forces acting on it.'],
    [
      sec(
        'Using conservation',
        f('p = mv', 'm_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2'),
        ol('Choose a positive direction; anything moving the other way gets a negative velocity.', 'Write the total momentum before.', 'Write the total after (objects that stick together share one velocity).', 'Equate and solve.'),
        'Explosions and recoil start with zero total momentum, so the parts move apart with equal and opposite momentum.',
        trap('Momentum is conserved in every collision, but kinetic energy usually is not: some is transferred to thermal energy and sound.'),
      ),
      sec(
        'Why it is conserved',
        "Newton's second law says force is the rate of change of momentum, F = Δp ÷ Δt. By the third law the forces on two colliding bodies are equal and opposite for the same time, so their momentum changes are equal and opposite and the total does not change.",
        tip('"Show that momentum is conserved" means calculating the total before and the total after and stating that they are equal.'),
      ),
    ],
  ),
  topic(
    'ph-energy',
    'WPH11 · 1',
    'Work, Energy and Power',
    'Work done · kinetic and gravitational potential energy · conservation of energy · power · efficiency',
    'Work done is energy transferred.',
    ['Work done: Force × distance moved in the direction of the force (J).', 'Kinetic energy: Energy of a moving mass, ½mv^2.', 'Gravitational potential energy: Energy due to height in a gravitational field; the change is mgΔh.', 'Power: Rate of energy transfer or of doing work (W = J s^{−1}).', 'Efficiency: Useful energy (or power) output ÷ total input.'],
    [
      sec(
        'Work and energy',
        f('ΔW = FΔs', 'ΔW = FΔs cos θ  (force at θ to the motion)', 'E_k = ½mv^2', 'ΔE_{grav} = mgΔh'),
        'Energy is conserved: it is transferred between stores, never created or destroyed. For a falling object with no resistive forces, mgΔh = ½mv^2, so v = √(2gΔh) whatever the mass.',
        'With friction, work done against the resistive force = loss of mechanical energy, which gives the average resistive force: F = ΔE ÷ distance.',
        trap('A force at right angles to the motion does no work. Carrying a bag horizontally at steady speed does no work on the bag.'),
      ),
      sec(
        'Power and efficiency',
        f('P = E ÷ t = W ÷ t', 'P = Fv', 'efficiency = useful output ÷ total input'),
        'P = Fv follows from W = Fs divided by t. At top speed the driving force equals the resistive forces, so P = F_{resistive} × v_{max}.',
        tip('Efficiency is a ratio with no unit. Give it as a decimal or a percentage, and never more than 1 (100%).'),
      ),
    ],
  ),
  topic(
    'ph-fluids',
    'WPH11 · 2',
    'Fluids',
    "Density · upthrust and Archimedes · laminar and turbulent flow · viscosity · Stokes' law · terminal velocity",
    'Upthrust is the weight of the fluid pushed aside.',
    ['Density: Mass per unit volume, ρ = m ÷ V (kg m^{−3}).', 'Upthrust: Upward force on a body in a fluid, equal to the weight of fluid displaced.', 'Laminar flow: Layers slide past each other without mixing; velocity at any point is constant.', 'Turbulent flow: Layers mix, with eddies; velocity at a point keeps changing.', 'Viscosity: A measure of a fluid’s resistance to flow, η (Pa s).', 'Terminal velocity: Constant velocity reached when the resultant force is zero.'],
    [
      sec(
        'Density and upthrust',
        f('ρ = m ÷ V', 'upthrust = ρ_{fluid} V g'),
        'V is the volume of the object that is **under the surface**. A floating object displaces its own weight of fluid; it sinks if its density is greater than the fluid’s.',
      ),
      sec(
        "Viscous drag and Stokes' law",
        f('F = 6πηrv'),
        ul('Applies to a **small sphere** moving **slowly** so the flow round it is **laminar**.', 'Viscosity of a liquid **falls** as temperature rises; for a gas it rises. Always control or record temperature.'),
        h('Terminal velocity of a falling sphere'),
        'At terminal velocity the forces balance: weight = upthrust + drag.',
        f('(4⁄3)πr^3 ρ_s g = (4⁄3)πr^3 ρ_f g + 6πηrv', 'v = 2r^2 g(ρ_s − ρ_f) ÷ 9η'),
        tip('Describe the fall in three steps: at first weight is greater than upthrust + drag, so it accelerates; drag grows with speed; when the forces balance the acceleration is zero.'),
        trap('Do not forget upthrust in the balance. In a dense liquid it is far from negligible.'),
      ),
    ],
  ),
  topic(
    'ph-solids',
    'WPH11 · 2',
    'Solid Materials',
    "Hooke's law · stress, strain and the Young modulus · force–extension and stress–strain graphs · elastic strain energy",
    'Stress over strain: a property of the material, not the sample.',
    [
      'Hooke’s law: Extension is proportional to force, up to the limit of proportionality.',
      'Stress: Force per unit cross-sectional area, σ = F ÷ A (Pa).',
      'Strain: Extension per unit original length, ε = Δx ÷ x (no unit).',
      'Young modulus: Stress ÷ strain in the linear region; the stiffness of a material (Pa).',
      'Elastic deformation: The material returns to its original shape when the force is removed.',
      'Plastic deformation: The material stays permanently deformed.',
    ],
    [
      sec(
        'The equations',
        f('ΔF = kΔx', 'σ = F ÷ A', 'ε = Δx ÷ x', 'E = σ ÷ ε', 'ΔE_{el} = ½FΔx'),
        'k is the stiffness of one object (N m^{−1}); E belongs to the material. The elastic strain energy is the **area under the force–extension graph**; ½FΔx only works while the graph is a straight line.',
      ),
      sec(
        'Reading a stress–strain graph',
        fig('stress', 'A ductile metal: straight to the limit of proportionality, then yield, then a long plastic region up to the breaking stress.'),
        tbl(
          ['Point', 'Meaning'],
          ['Limit of proportionality', 'End of the straight line; Hooke’s law stops applying'],
          ['Elastic limit', 'Beyond this the deformation is permanent'],
          ['Yield point', 'Large increase in strain for little or no extra stress'],
          ['Breaking stress', 'The stress at which the material fractures'],
        ),
        ul('Gradient of the straight part = Young modulus.', 'Brittle materials break with little or no plastic deformation; ductile ones can be drawn into wires; a strong material has a high breaking stress.'),
        tip('For the Young modulus of a wire: use a long, thin wire (large, measurable extension), a micrometer for diameter at several places, and plot stress against strain.'),
      ),
    ],
  ),
];

const u2 = [
  topic(
    'ph-waves',
    'WPH12 · 3',
    'Waves',
    'Wave quantities · v = fλ · transverse and longitudinal · wave graphs · phase · intensity',
    'A wave carries energy, not matter.',
    ['Amplitude: Maximum displacement from the equilibrium position.', 'Wavelength: Distance between two adjacent points in phase, λ.', 'Frequency: Number of oscillations per second (Hz).', 'Period: Time for one complete oscillation, T = 1 ÷ f.', 'Transverse: Oscillations perpendicular to the direction of energy transfer.', 'Longitudinal: Oscillations parallel to the direction of energy transfer, with compressions and rarefactions.'],
    [
      sec(
        'Describing a wave',
        f('v = fλ', 'f = 1 ÷ T', 'I = P ÷ A'),
        fig('wave', 'One wavelength is the distance the wave pattern moves forward in one period.'),
        ul('A **displacement–distance** graph is a snapshot: it gives λ.', 'A **displacement–time** graph follows one point: it gives T.', 'Sound is longitudinal; light and all electromagnetic waves, and waves on strings, are transverse.', 'Intensity is power per unit area (W m^{−2}).'),
      ),
      sec(
        'Phase and path difference',
        tbl(['Phase difference', 'Path difference', 'The two points are'], ['0, 2π, 4π …', '0, λ, 2λ …', 'In phase'], ['π, 3π …', '½λ, 1½λ …', 'In antiphase'], ['π ÷ 2', '¼λ', 'A quarter cycle apart']),
        f('phase difference = 2π × path difference ÷ λ'),
        'A **wavefront** joins points in phase. **Coherent** sources have the same frequency and a constant phase difference.',
        trap('Amplitude is measured from the centre line, not from trough to peak.'),
      ),
    ],
  ),
  topic(
    'ph-superposition',
    'WPH12 · 3',
    'Superposition and Standing Waves',
    'Superposition · interference · coherence · stationary waves · nodes and antinodes · waves on a string',
    'Where waves meet, their displacements add.',
    ['Superposition: The resultant displacement is the vector sum of the individual displacements.', 'Constructive interference: Waves meet in phase; amplitudes add.', 'Destructive interference: Waves meet in antiphase; amplitudes cancel.', 'Node: A point of zero amplitude on a stationary wave.', 'Antinode: A point of maximum amplitude on a stationary wave.'],
    [
      sec(
        'Interference',
        tbl(['Result', 'Path difference', 'Phase difference'], ['Maximum (constructive)', 'nλ', 'Even multiple of π'], ['Minimum (destructive)', '(n + ½)λ', 'Odd multiple of π']),
        'A stable pattern needs **coherent** sources. Two loudspeakers on one signal generator, or one laser through two slits, are coherent; two separate lamps are not.',
      ),
      sec(
        'Stationary waves',
        'Two waves of the same frequency and amplitude travelling in **opposite directions** superpose, usually a wave and its own reflection.',
        fig('standing', 'The string vibrates in loops. Nodes stay still; neighbouring nodes are half a wavelength apart.'),
        f('v = √(T ÷ μ)', 'f_1 = (1 ÷ 2L) √(T ÷ μ)'),
        ul('T is the tension, μ the mass per unit length (kg m^{−1}).', 'Fixed ends are nodes. The nth harmonic has n loops and λ = 2L ÷ n.', 'Points between two nodes move in phase; points either side of a node are in antiphase.'),
        tbl(['', 'Progressive wave', 'Stationary wave'], ['Energy', 'Transferred along the wave', 'Stored, not transferred'], ['Amplitude', 'Same at every point', 'Varies from zero (node) to maximum (antinode)'], ['Phase', 'Changes steadily along the wave', 'Only 0 or π between points']),
      ),
    ],
  ),
  topic(
    'ph-refraction',
    'WPH12 · 3',
    'Refraction and Polarisation',
    "Refractive index · Snell's law · critical angle · total internal reflection · plane polarisation",
    'Slower medium, smaller angle.',
    ['Refractive index: n = c ÷ v, the ratio of the speed of light in a vacuum to its speed in the medium.', 'Critical angle: The angle of incidence in the denser medium for which the angle of refraction is 90°.', 'Total internal reflection: All the light reflects at a boundary; none is transmitted.', 'Plane polarised: Oscillations confined to a single plane that includes the direction of travel.'],
    [
      sec(
        'Refraction',
        f('n = c ÷ v', 'n_1 sin θ_1 = n_2 sin θ_2', 'sin C = 1 ÷ n'),
        ul('Angles are measured from the **normal**.', 'Entering a denser medium light slows and bends **towards** the normal; frequency stays the same, wavelength shortens.', 'To measure n: trace rays through a block for several angles, plot sin i against sin r; the gradient is n.'),
        h('Total internal reflection'),
        'Needs two things: the light is travelling from the **higher** refractive index towards the lower, and the angle of incidence is **greater than the critical angle**. Used in optical fibres.',
        trap('sin C = 1 ÷ n is for a boundary with air. For two media use n_1 sin C = n_2 sin 90°.'),
      ),
      sec(
        'Polarisation',
        'Only **transverse** waves can be polarised, so polarisation is the evidence that light is transverse. Sound cannot be polarised.',
        ul('A polarising filter passes one plane of oscillation.', 'Two filters with planes at 90° (crossed) pass no light; rotating one through 360° gives two maxima and two minima.', 'Light reflected from water or glass is partly polarised, which is why polarising sunglasses cut glare.'),
      ),
    ],
  ),
  topic(
    'ph-diffraction',
    'WPH12 · 3',
    'Diffraction and Gratings',
    "Diffraction · Huygens' construction · the diffraction grating · electron diffraction · de Broglie · pulse-echo",
    'Most spreading when the gap matches the wavelength.',
    ['Diffraction: The spreading of a wave as it passes through a gap or round an obstacle.', 'Diffraction grating: Many equally spaced parallel slits that give sharp, bright maxima.', 'de Broglie wavelength: The wavelength associated with a moving particle, λ = h ÷ p.', 'Pulse-echo: Timing a reflected pulse to find the distance to a boundary.'],
    [
      sec(
        'Diffraction and the grating',
        "Huygens' construction: every point on a wavefront acts as a source of secondary wavelets; the new wavefront is the surface that touches them all.",
        f('nλ = d sin θ'),
        ul('d is the slit spacing: for N lines per metre, d = 1 ÷ N. Convert lines per mm first.', 'n is the order (0, 1, 2 …). The highest order is the largest whole number below d ÷ λ, since sin θ cannot exceed 1.', 'Longer wavelengths diffract more: in each order red is further out than violet.'),
        tip('Measure the angle between the two first-order maxima and halve it, or use tan θ = x ÷ D from the screen distances. Do not assume small angles for a grating.'),
      ),
      sec(
        'Electrons as waves',
        f('λ = h ÷ p = h ÷ mv'),
        'Electrons fired through thin graphite make rings on a screen, a diffraction pattern, which is evidence that particles have wave properties. A higher accelerating voltage gives more momentum, a shorter wavelength and smaller rings.',
      ),
      sec(
        'Pulse-echo',
        'At an interface between media a wave is partly transmitted and partly reflected. A pulse is sent, and the echo time gives the depth:',
        f('distance = vt ÷ 2'),
        ul('Shorter pulses and shorter wavelengths resolve finer detail.', 'The pulse must end before its echo returns, which limits how close a boundary can be detected.'),
      ),
    ],
  ),
  topic(
    'ph-quantum',
    'WPH12 · 3',
    'Photons and Quantum Physics',
    'The photon · the photoelectric effect · work function · the electronvolt · line spectra · wave–particle duality',
    'One photon, one electron.',
    ['Photon: A discrete packet (quantum) of electromagnetic energy, E = hf.', 'Work function: The minimum energy needed to release an electron from the surface of a metal, φ.', 'Threshold frequency: The lowest frequency of radiation that releases photoelectrons, f_0 = φ ÷ h.', 'Electronvolt: The energy gained by an electron moved through 1 V; 1 eV = 1.60 × 10^{−19} J.', 'Ground state: The lowest energy level of an atom.'],
    [
      sec(
        'The photoelectric effect',
        f('E = hf = hc ÷ λ', 'hf = φ + ½mv^2_{max}'),
        fig('photo', 'Each photon gives all its energy to one electron. Below the threshold frequency none escape, however bright the light.'),
        tbl(
          ['Observation', 'Why waves fail and photons work'],
          ['No emission below a threshold frequency, whatever the intensity', 'One photon must carry at least φ; energy cannot build up from many'],
          ['Emission starts at once', 'A single photon transfers its energy in one interaction'],
          ['Maximum kinetic energy depends on frequency, not intensity', 'Each electron gets hf from one photon'],
          ['More intensity gives more electrons per second', 'More photons per second arrive'],
        ),
        trap('½mv²max is the **maximum**: electrons from deeper in the metal lose energy on the way out.'),
      ),
      sec(
        'Line spectra and duality',
        'Electrons in atoms occupy **discrete energy levels**. Moving down a level emits one photon:',
        f('hf = E_1 − E_2'),
        'Each element has its own set of levels, so its own set of lines. Lines (rather than a continuous band) are the evidence that the levels are discrete.',
        'Light shows wave behaviour (diffraction, interference, polarisation) and particle behaviour (photoelectric effect). Electrons show both too: this is wave–particle duality.',
      ),
    ],
  ),
  topic(
    'ph-current',
    'WPH12 · 4',
    'Current and Resistance',
    'Charge and current · potential difference · resistance and Ohm’s law · I = nqvA · resistivity · I–V characteristics',
    'Current is charge per second. Voltage is energy per charge.',
    ['Current: Rate of flow of charge, I = ΔQ ÷ Δt (A).', 'Potential difference: Energy transferred per unit charge between two points, V = W ÷ Q.', 'Resistance: R = V ÷ I (Ω).', 'Ohm’s law: Current is proportional to p.d. at constant temperature.', 'Resistivity: R = ρl ÷ A; a property of the material (Ω m).', 'Drift velocity: The average velocity of the charge carriers along a conductor.'],
    [
      sec(
        'The basics',
        f('I = ΔQ ÷ Δt', 'V = W ÷ Q', 'R = V ÷ I', 'R = ρl ÷ A', 'I = nqvA'),
        ul('n is the number of charge carriers per m^3, v the drift velocity, A the cross-sectional area.', 'Metals have a huge n, so the drift velocity is only about a millimetre per second.', 'Semiconductors have a much smaller n; insulators almost none.'),
        trap('Convert areas: 1 mm^2 = 1 × 10^{−6} m^2. For a wire A = πd^2 ÷ 4, using the diameter in metres.'),
      ),
      sec(
        'I–V characteristics',
        tbl(
          ['Component', 'Graph', 'Reason'],
          ['Ohmic conductor (fixed temperature)', 'Straight line through the origin', 'Constant resistance'],
          ['Filament lamp', 'Curve flattening at high V', 'Hotter lattice ions vibrate more, so electrons collide more often: resistance rises'],
          ['Diode', 'Almost no current until about 0.6 V forward; none in reverse', 'Conducts in one direction only'],
          ['NTC thermistor', 'Curve steepening at high V', 'Heating releases more charge carriers (n rises): resistance falls'],
        ),
        'An LDR behaves like the thermistor with light in place of heat: more light, more carriers, less resistance.',
        tip('Resistance at a point is V ÷ I at that point, not the gradient of the curve.'),
      ),
    ],
  ),
  topic(
    'ph-circuits',
    'WPH12 · 4',
    'Circuits',
    'Conservation of charge and energy · series and parallel · power · potential dividers · e.m.f. and internal resistance',
    'Charge in equals charge out. Energy in equals energy out.',
    ['Electromotive force: Energy transferred to each coulomb of charge by the source, ε (V).', 'Internal resistance: The resistance of the source itself, r.', 'Terminal p.d.: The p.d. across the source’s terminals when a current flows.', 'Potential divider: Resistors in series that share the supply p.d. in the ratio of their resistances.'],
    [
      sec(
        'Series, parallel and power',
        tbl(['', 'Series', 'Parallel'], ['Current', 'Same everywhere', 'Splits; branch currents add up'], ['P.d.', 'Shared; adds up to the supply', 'Same across every branch'], ['Resistance', 'R = R_1 + R_2', '1 ÷ R = 1 ÷ R_1 + 1 ÷ R_2']),
        f('P = VI = I^2 R = V^2 ÷ R', 'W = VIt'),
        'Current at a junction is conserved because **charge** is conserved; the p.d.s round a loop add up to the e.m.f. because **energy** is conserved.',
      ),
      sec(
        'Potential dividers',
        f('V_1 = V_{in} × R_1 ÷ (R_1 + R_2)'),
        fig('circuit', 'The same current flows through both resistors, so the larger resistance takes the larger share of the p.d.'),
        'Swap one resistor for a thermistor or LDR to make a sensor: as temperature rises the thermistor’s resistance falls, so its share of the p.d. falls and the other resistor’s rises.',
      ),
      sec(
        'E.m.f. and internal resistance',
        f('ε = I(R + r)', 'V = ε − Ir'),
        ul('"Lost volts" Ir is energy wasted inside the cell.', 'Plot terminal p.d. V against current I: intercept ε, gradient −r.', 'A car battery needs a very low r to deliver a large starting current.'),
        trap('A voltmeter across a cell reads the e.m.f. only when (almost) no current flows.'),
      ),
    ],
  ),
];

const u3 = [
  topic(
    'ph-practical',
    'WPH13',
    'Practical Skills',
    'Planning · variables · uncertainties · graphs and linearising · evaluating',
    'An uncertainty is part of the answer.',
    ['Accuracy: How close a result is to the true value.', 'Precision: How close repeated readings are to each other.', 'Random error: Unpredictable scatter; reduced by repeating and averaging.', 'Systematic error: Shifts every reading the same way (e.g. zero error); not reduced by repeats.', 'Resolution: The smallest change an instrument can show.'],
    [
      sec(
        'Planning',
        ul('Name the **independent**, **dependent** and **control** variables.', 'Choose instruments by resolution and say why: micrometer (0.01 mm) for a wire’s diameter, metre rule (1 mm) for its length.', 'Describe how to cut error: repeat and average, measure many oscillations and divide, view at eye level to avoid parallax, check for zero error.', 'State the graph you will plot and how the answer comes from it.', 'One sensible safety point tied to the apparatus.'),
      ),
      sec(
        'Uncertainties',
        f('% uncertainty = uncertainty ÷ value × 100'),
        tbl(['Calculation', 'Rule'], ['Adding or subtracting', 'Add the absolute uncertainties'], ['Multiplying or dividing', 'Add the percentage uncertainties'], ['Raising to a power n', 'Multiply the percentage uncertainty by n'], ['Repeats', 'Half the range of the readings']),
        ul('A single reading: half the resolution; a measurement between two positions (a length with a rule): the full resolution.', 'Compare with an accepted value using **percentage difference**. If it is smaller than the percentage uncertainty, the result is consistent.', 'Quote the answer to the same significant figures as the data.'),
      ),
      sec(
        'Graphs',
        'Rearrange the equation into y = mx + c so the plot is a straight line, and read the constant from the gradient or intercept.',
        tbl(['Relationship', 'Plot', 'Gradient'], ['s = ½gt^2', 's against t^2', '½g'], ['V = ε − Ir', 'V against I', '−r'], ['R = ρl ÷ A', 'R against l', 'ρ ÷ A'], ['y = kx^n', 'log y against log x', 'n']),
        tip('Label axes with quantity and unit, use more than half the grid, draw a thin best-fit line, and take the gradient from a large triangle.'),
      ),
    ],
  ),
  topic(
    'ph-cp',
    'WPH13',
    'Core Practicals',
    'The eight AS core practicals: what is measured, what is plotted and what goes wrong',
    'Know what to plot and what the gradient means.',
    ['Core practical: An experiment the specification says you must have done; Unit 3 questions are built on them.'],
    [
      sec(
        'Unit 1 practicals',
        tbl(
          ['Practical', 'Method', 'Graph and result'],
          ['1 · Acceleration of free fall', 'Time a falling object over several heights (light gates or an electromagnet and trapdoor)', 's against t^2; gradient = ½g'],
          ['2 · Viscosity of a liquid', 'Time a small ball bearing falling between two marks in a tall tube, once at terminal velocity', 'η from Stokes’ law and the terminal velocity'],
          ['3 · Young modulus', 'Load a long thin wire; measure extension with a marker and scale, diameter with a micrometer', 'Stress against strain; gradient = E'],
        ),
        ul('Free fall: a delay in release makes t too long and g too small.', 'Viscosity: keep the ball away from the tube walls, check the speed is steady, record the temperature.', 'Young modulus: wear eye protection and keep within the elastic region.'),
      ),
      sec(
        'Unit 2 practicals',
        tbl(
          ['Practical', 'Method', 'Graph and result'],
          ['4 · Speed of sound in air', 'Two-beam oscilloscope, signal generator, speaker and microphone: move the microphone until the traces are back in phase', 'Distance moved = λ; v = fλ'],
          ['5 · Vibrating string', 'Vibration generator and a string under tension: vary length, tension or mass per unit length', 'f against 1 ÷ L, or f against √T: straight lines'],
          ['6 · Wavelength of light', 'Laser through a diffraction grating onto a distant screen', 'nλ = d sin θ with tan θ = x ÷ D'],
          ['7 · Resistivity', 'Measure R for different lengths of wire; diameter with a micrometer', 'R against l; gradient = ρ ÷ A'],
          ['8 · E.m.f. and internal resistance', 'Vary a load resistor; record terminal p.d. and current', 'V against I; intercept ε, gradient −r'],
        ),
        ul('Laser: never look along the beam; a larger screen distance cuts the percentage uncertainty in x.', 'Resistivity: keep the current small and switch off between readings so the wire does not heat up.', 'Internal resistance: open the switch between readings so the cell does not run down.'),
      ),
    ],
  ),
];

export const PHYSICS: NoteSubject = {
  id: 'physics',
  name: 'Physics',
  study: 'Physics',
  board: 'Edexcel International A Level',
  hue: 205,
  units: [
    { id: 'wph11', code: 'WPH11', name: 'Unit 1 · Mechanics and Materials', topics: u1 },
    { id: 'wph12', code: 'WPH12', name: 'Unit 2 · Waves and Electricity', topics: u2 },
    { id: 'wph13', code: 'WPH13', name: 'Unit 3 · Practical Skills I', topics: u3 },
    ...PHYSICS_A2,
  ],
};
