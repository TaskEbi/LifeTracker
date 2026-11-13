/** Physics: Pearson Edexcel International A Level, A2 units WPH14–WPH16. */
import { f, fig, ol, sec, tbl, tip, topic, trap, ul, type NoteUnit } from '../types';

const u4 = [
  topic(
    'ph-impulse',
    'WPH14 · 5',
    'Further Mechanics',
    'Impulse · momentum in two dimensions · elastic and inelastic collisions · kinetic energy from momentum',
    'Momentum is conserved in each direction separately.',
    ['Impulse: Force × time for which it acts, equal to the change in momentum (N s).', 'Elastic collision: One in which total kinetic energy is conserved.', 'Inelastic collision: One in which some kinetic energy is transferred to other stores.'],
    [
      sec(
        'Impulse',
        f('F = Δp ÷ Δt', 'impulse = FΔt = Δp'),
        'On a force–time graph the impulse is the **area under the curve**. A longer collision time means a smaller force for the same change in momentum: crumple zones, air bags, bending your knees.',
        trap('If an object rebounds, Δp = m(v + u) in size. Reversing direction more than doubles the momentum change compared with stopping.'),
      ),
      sec(
        'Collisions in two dimensions',
        ol('Choose x and y axes, usually along the incoming velocity.', 'Resolve every momentum into x and y.', 'Conserve momentum in x; conserve it in y (often zero before).', 'Solve the two equations.'),
        f('E_k = p^2 ÷ 2m'),
        ul('Check for an elastic collision by comparing total E_k before and after.', 'Equal masses, one at rest, elastic and not head-on: they leave at **90°** to each other.', 'E_k = p^2 ÷ 2m is useful for particles: same momentum, the lighter particle has more kinetic energy.'),
      ),
    ],
  ),
  topic(
    'ph-circular',
    'WPH14 · 5',
    'Circular Motion',
    'Radians and angular velocity · centripetal acceleration · centripetal force',
    'Constant speed, changing velocity.',
    ['Angular velocity: Angle turned through per second, ω (rad s^{−1}).', 'Centripetal acceleration: Acceleration towards the centre of the circle.', 'Centripetal force: The resultant force towards the centre that keeps a body in circular motion.'],
    [
      sec(
        'The equations',
        f('ω = Δθ ÷ Δt = 2π ÷ T = 2πf', 'v = ωr', 'a = v^2 ÷ r = rω^2', 'F = mv^2 ÷ r = mrω^2'),
        'The velocity is always changing direction, so there is an acceleration even at constant speed. It points to the centre, at right angles to the velocity, so the force does **no work** and the speed does not change.',
      ),
      sec(
        'Finding the centripetal force',
        'Centripetal force is not a new force: it is the **resultant** of the real forces along the radius.',
        tbl(['Situation', 'What provides it'], ['Car on a flat bend', 'Friction'], ['Satellite', 'Gravity'], ['Mass on a string, horizontal circle', 'Horizontal component of tension'], ['Top of a vertical circle', 'Weight + tension (or weight − reaction)'], ['Bottom of a vertical circle', 'Tension − weight']),
        tip('At the top of a loop the minimum speed is when the contact force is zero: mg = mv^2 ÷ r, so v = √(gr).'),
      ),
    ],
  ),
  topic(
    'ph-efields',
    'WPH14 · 6',
    'Electric Fields',
    "Field strength · Coulomb's law · radial and uniform fields · electric potential · equipotentials",
    'Field strength is force per coulomb. Potential is energy per coulomb.',
    ['Electric field: A region where a charge experiences a force.', 'Electric field strength: Force per unit positive charge, E = F ÷ Q (N C^{−1} or V m^{−1}).', 'Electric potential: Work done per unit positive charge in bringing it from infinity to the point (V).', 'Equipotential: A surface joining points of equal potential; no work is done moving along it.'],
    [
      sec(
        'Radial fields',
        f('F = Q_1 Q_2 ÷ 4πε_0 r^2', 'E = Q ÷ 4πε_0 r^2', 'V = Q ÷ 4πε_0 r'),
        ul('Force and field strength follow an **inverse-square** law; potential falls as 1 ÷ r.', 'Field lines point the way a positive charge would move: away from +, towards −. Closer lines mean a stronger field.', 'Field strength is a vector (add with directions); potential is a scalar (just add, with signs).'),
      ),
      sec(
        'Uniform fields',
        f('E = V ÷ d'),
        'Between parallel plates the field is the same everywhere: parallel, equally spaced lines. A charge feels a constant force EQ, so it accelerates uniformly and follows a **parabola** if it enters at right angles, like a projectile.',
        'Equipotentials are always perpendicular to field lines: circles round a point charge, parallel planes between plates. Field strength is the potential gradient.',
        tbl(['', 'Electric', 'Gravitational'], ['Acts on', 'Charge', 'Mass'], ['Direction', 'Attracts or repels', 'Only attracts'], ['Force law', 'Q_1 Q_2 ÷ 4πε_0 r^2', 'Gm_1 m_2 ÷ r^2']),
      ),
    ],
  ),
  topic(
    'ph-capacitors',
    'WPH14 · 6',
    'Capacitors',
    'Capacitance · energy stored · charging and discharging through a resistor · the time constant',
    'After one time constant, 37% is left.',
    ['Capacitance: Charge stored per unit potential difference, C = Q ÷ V (F).', 'Time constant: RC, the time for the charge to fall to 1 ÷ e (about 37%) of its value.', 'Exponential decay: A quantity falling by the same fraction in equal times.'],
    [
      sec(
        'Storing charge and energy',
        f('C = Q ÷ V', 'W = ½QV = ½CV^2 = ½Q^2 ÷ C'),
        'The energy is the area under a p.d.–charge graph, a triangle, which is where the ½ comes from. The other half of the energy supplied by the cell is dissipated in the resistance of the circuit.',
      ),
      sec(
        'Discharging and charging',
        f('Q = Q_0 e^{−t/RC}', 'V = V_0 e^{−t/RC}', 'I = I_0 e^{−t/RC}', 'ln Q = ln Q_0 − t ÷ RC'),
        ul('Time constant τ = RC. After 5RC the capacitor is effectively discharged.', 'Time to halve = RC ln 2 ≈ 0.69RC.', 'A graph of ln V against t is a straight line of gradient −1 ÷ RC.', 'Charging: current still decays exponentially, while Q and V rise towards their maximum: V = V_0 (1 − e^{−t/RC}).'),
        tip('The gradient of a charge–time graph is the current. The area under a current–time graph is the charge that has flowed.'),
        trap('Convert first: μF is 10^{−6} F, kΩ is 10^3 Ω. 470 μF with 10 kΩ gives RC = 4.7 s.'),
      ),
    ],
  ),
  topic(
    'ph-magnetic',
    'WPH14 · 6',
    'Magnetic Fields and Induction',
    "Flux density · force on a wire and on a moving charge · flux and flux linkage · Faraday's and Lenz's laws · alternating current",
    'A changing flux linkage induces an e.m.f.',
    ['Magnetic flux density: B, the force per unit current per unit length on a wire at right angles to the field (T).', 'Magnetic flux: Φ = BA, for a field at right angles to the area (Wb).', 'Flux linkage: NΦ, the flux through a coil multiplied by its number of turns.', 'Root-mean-square value: The steady value that would deliver the same power as the alternating one.'],
    [
      sec(
        'Forces',
        f('F = BIl sin θ', 'F = Bqv sin θ'),
        ul("Fleming's **left-hand** rule: first finger field, second finger current, thumb force.", 'Current is the direction a **positive** charge moves; for electrons reverse it.', 'The force on a moving charge is always perpendicular to its velocity, so it moves in a **circle** and the field does no work: Bqv = mv^2 ÷ r, giving r = p ÷ BQ.'),
      ),
      sec(
        'Electromagnetic induction',
        f('Φ = BA', 'ε = −d(NΦ) ÷ dt'),
        ul("**Faraday's law:** the induced e.m.f. equals the rate of change of flux linkage.", "**Lenz's law:** the induced e.m.f. acts in the direction that opposes the change producing it (the minus sign). It is conservation of energy: work must be done to induce a current.", 'On a flux linkage–time graph the e.m.f. is the gradient.'),
        tip('To explain a magnet falling slowly through a tube: changing flux, so induced e.m.f. (Faraday), so current in the tube, which makes a field that opposes the motion (Lenz).'),
      ),
      sec(
        'Alternating current',
        f('V_{rms} = V_0 ÷ √2', 'I_{rms} = I_0 ÷ √2'),
        'Use r.m.s. values in power calculations: mean power = I_{rms} V_{rms}. The mains value quoted is the r.m.s. value.',
      ),
    ],
  ),
  topic(
    'ph-nuclear-atom',
    'WPH14 · 7',
    'The Nuclear Atom and Accelerators',
    'Alpha scattering · the nuclear model · thermionic emission · linacs and cyclotrons · detectors · mass and energy',
    'Most of an atom is empty space.',
    ['Nucleon number: The total number of protons and neutrons in a nucleus, A.', 'Proton number: The number of protons, Z.', 'Thermionic emission: The release of electrons from a heated metal surface.', 'Electronvolt: The energy gained by one electron accelerated through 1 V, 1.60 × 10^{−19} J.'],
    [
      sec(
        'Alpha-particle scattering',
        tbl(['Observation', 'Conclusion'], ['Most alphas pass straight through', 'The atom is mostly empty space'], ['A few are deflected through large angles', 'There is a concentrated positive charge'], ['Very few come straight back', 'The nucleus is tiny and holds almost all the mass']),
      ),
      sec(
        'Accelerators and detectors',
        f('r = p ÷ BQ', 'ΔE = c^2 Δm'),
        ul('**Linac:** a line of drift tubes joined to an alternating p.d. Particles accelerate in the gaps; the tubes get longer so the particle always arrives as the field reverses.', '**Cyclotron:** two D-shaped electrodes in a magnetic field. The field bends the particles into semicircles; the alternating p.d. accelerates them across the gap. The frequency f = BQ ÷ 2πm does not depend on speed, until relativistic effects make the mass increase.', '**Detectors:** only charged particles leave tracks. Curvature in a magnetic field gives the sign of the charge and the momentum; a spiral means the particle is losing energy.'),
        'High energies are needed to see fine detail, because λ = h ÷ p must be about the size of what is being probed, and to create massive particles, since E = mc^2.',
        tip('In track questions apply three conservation laws: charge, momentum and energy. A track that appears from nowhere came from a neutral particle.'),
        'Units: masses in MeV/c^2 or GeV/c^2, or in u, where 1 u = 931.5 MeV/c^2.',
      ),
    ],
  ),
  topic(
    'ph-particles',
    'WPH14 · 7',
    'Particle Physics',
    'Quarks and leptons · baryons and mesons · antiparticles · conservation laws · creation and annihilation',
    'Three quarks make a baryon. A quark and an antiquark make a meson.',
    ['Hadron: A particle made of quarks; baryons and mesons.', 'Lepton: A fundamental particle that does not feel the strong force, such as the electron and neutrino.', 'Antiparticle: Same mass, opposite charge and opposite quantum numbers.', 'Annihilation: A particle and its antiparticle meet and their mass becomes photon energy.'],
    [
      sec(
        'The standard model',
        tbl(['', 'Charge', 'Baryon number', 'Lepton number'], ['Up quark u', '+2/3', '1/3', '0'], ['Down quark d', '−1/3', '1/3', '0'], ['Strange quark s', '−1/3', '1/3', '0'], ['Electron, muon', '−1', '0', '1'], ['Neutrinos', '0', '0', '1']),
        ul('Proton = uud, neutron = udd. An antiproton is made of the antiquarks.', 'Pions and kaons are mesons: one quark, one antiquark.', 'There are three generations of quarks and of leptons, each heavier than the last. Photons carry the electromagnetic force.'),
      ),
      sec(
        'Conservation laws',
        'An interaction is possible only if **charge**, **baryon number** and **lepton number** are each the same before and after, along with energy and momentum.',
        f('β^− decay:  n → p + e^− + antineutrino', 'in quarks:  d → u + e^− + antineutrino'),
        ul('**Pair production:** a photon of energy at least 2mc^2 becomes a particle and its antiparticle, near a nucleus.', '**Annihilation:** two photons are produced, in opposite directions to conserve momentum, each of energy at least mc^2.', 'Fast-moving particles live longer in the laboratory frame than at rest (relativistic time dilation), which is why muons made in the upper atmosphere reach the ground.'),
      ),
    ],
  ),
];

const u5 = [
  topic(
    'ph-thermal',
    'WPH15 · 8',
    'Thermal Energy and Gases',
    'Specific heat capacity · specific latent heat · internal energy · the ideal gas equation · kinetic theory',
    'Temperature measures the average kinetic energy of the molecules.',
    ['Specific heat capacity: Energy needed to raise the temperature of 1 kg by 1 K.', 'Specific latent heat: Energy needed to change the state of 1 kg at constant temperature.', 'Internal energy: The sum of the random kinetic and potential energies of the molecules.', 'Absolute zero: The temperature at which molecules have their minimum kinetic energy, 0 K = −273 °C.', 'Ideal gas: One that obeys pV = NkT at all temperatures and pressures.'],
    [
      sec(
        'Heating and changing state',
        f('ΔE = mcΔθ', 'ΔE = LΔm'),
        'While a substance melts or boils its temperature stays constant: the energy supplied increases the **potential** energy of the molecules (breaking bonds), not their kinetic energy.',
        tip('For a mixing question write: energy lost by the hot object = energy gained by the cold one, including any change of state.'),
      ),
      sec(
        'Ideal gases',
        f('pV = NkT', '½m⟨c^2⟩ = (3⁄2)kT', 'pV = ⅓Nm⟨c^2⟩'),
        ul('T must be in **kelvin**: T = θ + 273.', 'For a fixed mass: pV ÷ T is constant. Constant T gives p ∝ 1 ÷ V; constant V gives p ∝ T.', 'Pressure comes from molecules colliding with the walls: each collision changes the momentum of a molecule, and the rate of change of momentum is a force.', 'Assumptions: molecules of negligible volume, no forces between them except in collisions, elastic collisions, random motion.', 'For an ideal gas the internal energy is all kinetic, so it depends only on temperature.'),
        trap('⟨c^2⟩ is the **mean of the squares**, not the square of the mean speed. The r.m.s. speed is its square root.'),
      ),
    ],
  ),
  topic(
    'ph-decay',
    'WPH15 · 9',
    'Nuclear Decay',
    'Background radiation · alpha, beta and gamma · decay equations · activity and the decay constant · half-life',
    'Decay is random and spontaneous.',
    ['Activity: The number of decays per second (Bq).', 'Decay constant: The probability that a nucleus decays per unit time, λ (s^{−1}).', 'Half-life: The time for half the unstable nuclei, or the activity, to decay.', 'Random: It cannot be predicted which nucleus will decay next, or when.', 'Spontaneous: Not affected by temperature, pressure or chemical state.'],
    [
      sec(
        'The three radiations',
        tbl(['', 'Alpha', 'Beta-minus', 'Gamma'], ['Is', 'Helium nucleus', 'Fast electron', 'Electromagnetic wave'], ['Ionising', 'Strongly', 'Moderately', 'Weakly'], ['Stopped by', 'Paper, a few cm of air', 'A few mm of aluminium', 'Reduced by cm of lead'], ['Effect on nucleus', 'A − 4, Z − 2', 'Z + 1', 'None']),
        'Balance every decay equation for **nucleon number** and **proton number**. Always subtract the background count before using a measured count rate.',
      ),
      sec(
        'Exponential decay',
        f('A = λN', 'dN ÷ dt = −λN', 'N = N_0 e^{−λt}', 'A = A_0 e^{−λt}', 'λ = ln 2 ÷ t_{½}'),
        ul('ln A against t is a straight line of gradient −λ.', 'After n half-lives the fraction left is (½)^n.', 'To find N from a mass: N = mass ÷ molar mass × 6.02 × 10^{23}.'),
        tip('Keep λ and t in matching units. If the half-life is in years, either convert it to seconds or keep t in years as well.'),
      ),
    ],
  ),
  topic(
    'ph-binding',
    'WPH15 · 9',
    'Binding Energy, Fission and Fusion',
    'Mass defect · binding energy per nucleon · fission · fusion and the conditions it needs',
    'Missing mass is binding energy.',
    ['Mass defect: The difference between the mass of a nucleus and the total mass of its separate nucleons.', 'Binding energy: The energy needed to separate a nucleus into its nucleons.', 'Fission: A heavy nucleus splitting into two lighter ones.', 'Fusion: Two light nuclei joining to make a heavier one.'],
    [
      sec(
        'Mass and energy',
        f('ΔE = c^2 Δm', '1 u = 931.5 MeV'),
        ol('Add the masses of the separate protons and neutrons.', 'Subtract the mass of the nucleus: this is the mass defect.', 'Convert to energy: × 931.5 for MeV if working in u.', 'Divide by the nucleon number for binding energy per nucleon.'),
      ),
      sec(
        'The binding energy curve',
        'Binding energy per nucleon rises steeply for light nuclei, peaks near **iron-56** (the most stable) and falls slowly for heavy ones. Any change that moves nuclei towards the peak releases energy.',
        tbl(['', 'Fission', 'Fusion'], ['Nuclei', 'Heavy, e.g. uranium-235', 'Light, e.g. hydrogen isotopes'], ['Energy per nucleon', 'Smaller', 'Larger'], ['Needs', 'A neutron to trigger it', 'Very high temperature and density']),
        'Fusion needs a very high **temperature** so the nuclei have enough kinetic energy to overcome their electrostatic repulsion and get close enough for the strong force, and a very high **density** so collisions are frequent. This is why it is hard to sustain on Earth.',
      ),
    ],
  ),
  topic(
    'ph-shm',
    'WPH15 · 10',
    'Oscillations',
    'Simple harmonic motion · the mass–spring system and the pendulum · energy · damping · resonance',
    'Acceleration is proportional to displacement, and opposite.',
    ['Simple harmonic motion: Oscillation in which acceleration is proportional to displacement from equilibrium and directed towards it.', 'Damping: The loss of energy from an oscillation through resistive forces.', 'Natural frequency: The frequency at which a system oscillates freely.', 'Resonance: A large increase in amplitude when the driving frequency equals the natural frequency.'],
    [
      sec(
        'The equations',
        f('F = −kx', 'a = −ω^2 x', 'x = A cos ωt', 'v = −Aω sin ωt', 'a = −Aω^2 cos ωt', 'T = 2π ÷ ω'),
        f('T = 2π√(m ÷ k)', 'T = 2π√(l ÷ g)'),
        fig('unitcircle', 'Simple harmonic motion is circular motion seen side-on: the height of the point moving round the circle is the displacement.'),
        ul('Maximum speed Aω is at the centre; maximum acceleration Aω^2 is at the ends.', 'Velocity is the gradient of the displacement–time graph; acceleration is the gradient of the velocity–time graph.', 'The period does not depend on the amplitude.'),
      ),
      sec(
        'Energy, damping and resonance',
        'Energy swaps between kinetic (maximum at the centre) and potential (maximum at the ends). The total, ½kA^2, is constant if there is no damping, so energy ∝ amplitude^2.',
        tbl(['Damping', 'Behaviour'], ['Light', 'Amplitude decays gradually over many oscillations'], ['Critical', 'Returns to equilibrium in the shortest time without oscillating'], ['Heavy', 'Returns slowly without oscillating']),
        ul('A **forced** oscillation is driven at the frequency of the driver. At resonance energy is transferred most efficiently.', 'More damping makes the resonance peak lower and broader, and moves it to a slightly lower frequency.', 'Ductile materials damp by deforming plastically, which is how buildings and bridges are protected.'),
      ),
    ],
  ),
  topic(
    'ph-gravity',
    'WPH15 · 11',
    'Gravitational Fields',
    "Field strength · Newton's law of gravitation · gravitational potential · orbits",
    'Double the distance, a quarter of the force.',
    ['Gravitational field strength: Force per unit mass, g = F ÷ m (N kg^{−1}).', 'Gravitational potential: Work done per unit mass in bringing a mass from infinity to the point (J kg^{−1}).', 'Geostationary orbit: An orbit above the equator with a period of 24 hours, so the satellite stays over one point.'],
    [
      sec(
        'Fields and potential',
        f('F = Gm_1 m_2 ÷ r^2', 'g = Gm ÷ r^2', 'V_{grav} = −Gm ÷ r'),
        ul('r is measured from the **centre** of the mass: use radius + height.', 'Potential is negative because it is zero at infinity and work must be done to get there.', 'Near a surface the field is nearly uniform and ΔE = mgΔh works; over large distances use ΔE = mΔV.'),
      ),
      sec(
        'Orbits',
        'Gravity provides the centripetal force:',
        f('Gm_1 m_2 ÷ r^2 = m_2 v^2 ÷ r  ⟹  v = √(Gm ÷ r)', 'T^2 = 4π^2 r^3 ÷ Gm'),
        'So T^2 ∝ r^3, and the orbital speed and period do **not** depend on the mass of the satellite.',
        trap('In orbit astronauts are not weightless: gravity is what keeps them in orbit. They feel weightless because they and the craft are in free fall together.'),
      ),
    ],
  ),
  topic(
    'ph-stars',
    'WPH15 · 11',
    'Stars',
    "Black-body radiation · Stefan–Boltzmann and Wien's laws · luminosity and intensity · measuring distance · the Hertzsprung–Russell diagram · stellar evolution",
    'Hotter means bluer, and far brighter.',
    ['Luminosity: The total power radiated by a star (W).', 'Black body: A perfect absorber and emitter of radiation at all wavelengths.', 'Standard candle: An object of known luminosity, used to find distance.', 'Parallax: The apparent shift of a nearby star against distant ones as the Earth orbits the Sun.'],
    [
      sec(
        'Radiation from stars',
        f('L = σAT^4 = 4πr^2 σT^4', 'λ_{max} T = 2.898 × 10^{−3} m K', 'I = L ÷ 4πd^2'),
        ul('Wien: the hotter the star, the shorter the peak wavelength.', 'Stefan–Boltzmann: luminosity depends on surface area and on T^4.', 'Intensity at the Earth falls with the inverse square of distance.'),
      ),
      sec(
        'Distances',
        ul('**Trigonometric parallax** for nearby stars: measure the angular shift six months apart; d = radius of the Earth’s orbit ÷ tan(parallax angle).', '**Standard candles** for far ones: know L, measure I, find d from I = L ÷ 4πd^2.'),
      ),
      sec(
        'The Hertzsprung–Russell diagram',
        'Luminosity (log scale, upwards) against temperature (**decreasing** to the right).',
        tbl(['Region', 'Stars'], ['Main sequence (diagonal band)', 'Fusing hydrogen in the core; hot bright ones top left'], ['Top right', 'Red giants and supergiants: cool but very large'], ['Bottom left', 'White dwarfs: hot but very small']),
        'A Sun-like star: main sequence → red giant → planetary nebula → white dwarf. A massive star: main sequence → red supergiant → supernova → neutron star or black hole. Massive stars are more luminous and use their fuel faster.',
      ),
    ],
  ),
  topic(
    'ph-cosmology',
    'WPH15 · 11',
    'Cosmology',
    "The Doppler effect and redshift · Hubble's law · the age and fate of the Universe · dark matter",
    'The further away a galaxy is, the faster it recedes.',
    ['Redshift: The fractional increase in wavelength of light from a receding source, z.', 'Hubble constant: The ratio of recession speed to distance, H_0.', 'Dark matter: Matter that has mass but does not emit or absorb electromagnetic radiation.'],
    [
      sec(
        'Redshift and Hubble',
        f('z = Δλ ÷ λ ≈ Δf ÷ f ≈ v ÷ c', 'v = H_0 d', 'age ≈ 1 ÷ H_0'),
        ul('Light from almost every galaxy is redshifted, so they are moving away: the Universe is **expanding**.', 'A graph of recession speed against distance is a straight line through the origin of gradient H_0.', 'The z ≈ v ÷ c form only holds for speeds much less than c.', 'H_0 is uncertain mainly because distances to far galaxies are hard to measure.'),
      ),
      sec(
        'Fate and dark matter',
        'Whether the expansion continues depends on the average **density** of the Universe: above a critical density gravity would stop it; below, it goes on for ever.',
        'Stars at the edge of galaxies orbit faster than the visible mass can explain, so there must be extra unseen mass: dark matter. Because it cannot be observed directly, the density, and so the ultimate fate, is uncertain.',
        tip('Give the Hubble constant in s^{−1} before taking 1 ÷ H_0: convert km s^{−1} Mpc^{−1} using the value of a megaparsec in metres.'),
      ),
    ],
  ),
];

const u6 = [
  topic(
    'ph-practical2',
    'WPH16',
    'Practical Skills II',
    'The eight A2 core practicals · log graphs · combining uncertainties · evaluating a method',
    'A straight line proves the relationship.',
    ['Log–log graph: A plot of log y against log x; a power law y = kx^n gives a straight line of gradient n.', 'Log–linear graph: A plot of ln y against x; an exponential y = Ae^{kx} gives a straight line of gradient k.', 'Percentage difference: The difference between a result and the accepted value, as a percentage of the accepted value.'],
    [
      sec(
        'The core practicals',
        tbl(
          ['Practical', 'Method', 'Analysis'],
          ['9 · Force and momentum change', 'A trolley pulled by a falling mass through light gates', 'FΔt against Δp'],
          ['10 · Collisions', 'Video or ICT analysis of colliding spheres', 'Momentum before and after in two dimensions'],
          ['11 · Capacitor charge and discharge', 'Data logger or oscilloscope across the capacitor', 'ln V against t; gradient −1 ÷ RC'],
          ['12 · Thermistor calibration', 'Thermistor in a potential divider, in a water bath', 'Output p.d. against temperature'],
          ['13 · Specific latent heat', 'Heater in melting ice or boiling water, mass change measured', 'L = energy supplied ÷ Δm'],
          ['14 · Pressure and volume of a gas', 'Trapped gas at constant temperature', 'p against 1 ÷ V is a straight line'],
          ['15 · Absorption of gamma by lead', 'Count rate through different thicknesses, background subtracted', 'ln(count rate) against thickness'],
          ['16 · Unknown mass by resonance', 'Period of a mass–spring system for known masses', 'T^2 against m, read off the unknown'],
        ),
      ),
      sec(
        'Analysis skills',
        f('y = kx^n  ⟹  log y = n log x + log k', 'y = Ae^{kx}  ⟹  ln y = kx + ln A'),
        ul('State the expected gradient and intercept before plotting.', 'Uncertainty in a gradient: draw the steepest and shallowest lines the error bars allow.', 'When multiplying or dividing add percentage uncertainties; for a power, multiply by the power.', 'A conclusion is supported if the percentage difference from the accepted value is smaller than the percentage uncertainty.'),
        tip('To improve a method, name the measurement with the largest percentage uncertainty and say how to reduce it: a larger value, a finer instrument, or a data logger for fast changes.'),
      ),
    ],
  ),
];

export const PHYSICS_A2: NoteUnit[] = [
  { id: 'wph14', code: 'WPH14', name: 'Unit 4 · Further Mechanics, Fields and Particles', a2: true, topics: u4 },
  { id: 'wph15', code: 'WPH15', name: 'Unit 5 · Thermodynamics, Radiation, Oscillations and Cosmology', a2: true, topics: u5 },
  { id: 'wph16', code: 'WPH16', name: 'Unit 6 · Practical Skills II', a2: true, topics: u6 },
];
