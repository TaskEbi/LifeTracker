/** Maths: Pearson Edexcel International A Level, A2 units P3 and P4, plus M2 and S2. */
import { f, fig, ol, sec, tbl, tip, topic, trap, ul, type NoteUnit } from '../types';

const p3 = [
  topic(
    'ma-p3-fractions',
    'P3 · 1',
    'Algebraic Fractions',
    'Simplifying · multiplying and dividing · adding and subtracting · improper fractions and division',
    'Factorise first. Then cancel.',
    ['Rational expression: One polynomial divided by another.', 'Improper fraction: The degree of the top is at least the degree of the bottom.'],
    [
      sec(
        'Simplifying and combining',
        ul('Factorise top and bottom completely, then cancel common **factors** (never terms).', 'To divide, multiply by the reciprocal.', 'To add or subtract, use the lowest common denominator: for 1 ÷ (x + 1) and 1 ÷ (x + 1)(x − 2) it is (x + 1)(x − 2).'),
        trap('(x + 3) ÷ (x + 5) does not simplify: the x terms cannot be cancelled because they are not factors.'),
      ),
      sec(
        'Improper fractions',
        'Divide until the remainder has lower degree than the divisor:',
        f('F(x) ÷ divisor = quotient + remainder ÷ divisor', '(x^2 + 3x + 5) ÷ (x + 1) = x + 2 + 3 ÷ (x + 1)'),
        tip('Either use long division, or write F(x) ≡ Q(x) × divisor + R and compare coefficients.'),
      ),
    ],
  ),
  topic(
    'ma-p3-functions',
    'P3 · 2',
    'Functions and Graphs',
    'Domain and range · composite and inverse functions · the modulus function · combined transformations',
    'An inverse exists only for a one-to-one function.',
    ['Domain: The set of inputs a function accepts.', 'Range: The set of outputs it produces.', 'Composite function: fg(x) means do g first, then f.', 'Inverse function: f^{−1} undoes f; its graph is the reflection of f in y = x.', 'Modulus: |x| is the size of x, always ≥ 0.'],
    [
      sec(
        'Composite and inverse',
        ul('fg(x) = f(g(x)). The order matters: fg and gf are usually different.', 'To find f^{−1}: write y = f(x), rearrange for x, swap the letters.', 'Domain of f^{−1} = range of f; range of f^{−1} = domain of f.', 'A many-to-one function has no inverse unless its domain is restricted.'),
        tip('State the range with the right letter: f(x) ≥ 2 for a range, x ≥ 2 for a domain.'),
      ),
      sec(
        'Modulus',
        tbl(['Graph', 'How to draw it'], ['y = |f(x)|', 'Reflect the part below the x-axis up'], ['y = f(|x|)', 'Keep the part for x ≥ 0 and reflect it in the y-axis']),
        'To solve |f(x)| = g(x), sketch both graphs, then solve f(x) = g(x) and −f(x) = g(x) and **check** each answer against the sketch. For inequalities, find the intersections and read the answer off the sketch.',
        'Combined transformations: work from the inside out. y = 2f(x − 3) + 1 is a translation 3 right, a vertical stretch by 2, then 1 up.',
      ),
    ],
  ),
  topic(
    'ma-p3-trig',
    'P3 · 3',
    'Further Trigonometry',
    'sec, cosec and cot · inverse functions · Pythagorean identities · addition and double-angle formulae · R cos(θ − α)',
    'Everything comes from the addition formulae.',
    ['Secant: sec x = 1 ÷ cos x.', 'Cosecant: cosec x = 1 ÷ sin x.', 'Cotangent: cot x = cos x ÷ sin x.', 'arcsin: The inverse of sine, with range −π/2 to π/2.'],
    [
      sec(
        'Identities',
        f('1 + tan^2 x ≡ sec^2 x', '1 + cot^2 x ≡ cosec^2 x', 'sin(A ± B) ≡ sin A cos B ± cos A sin B', 'cos(A ± B) ≡ cos A cos B ∓ sin A sin B', 'tan(A ± B) ≡ (tan A ± tan B) ÷ (1 ∓ tan A tan B)'),
        f('sin 2A ≡ 2 sin A cos A', 'cos 2A ≡ cos^2 A − sin^2 A ≡ 2cos^2 A − 1 ≡ 1 − 2sin^2 A', 'tan 2A ≡ 2 tan A ÷ (1 − tan^2 A)'),
        'Ranges of the inverses: arcsin and arctan give −π/2 to π/2; arccos gives 0 to π.',
      ),
      sec(
        'The form R cos(θ − α)',
        f('a cos θ + b sin θ ≡ R cos(θ − α)', 'R = √(a^2 + b^2),   tan α = b ÷ a'),
        ul('Expand the right side and compare coefficients of cos θ and sin θ.', 'Maximum value is R, when θ − α = 0; minimum is −R.', 'To solve a cos θ + b sin θ = c, rewrite and solve cos(θ − α) = c ÷ R.'),
        tip('In a proof, start from the more complicated side and work towards the simpler one. Never move terms across the ≡ sign.'),
      ),
    ],
  ),
  topic(
    'ma-p3-exp',
    'P3 · 4',
    'Exponentials and Natural Logarithms',
    'e^x and ln x · solving equations · modelling growth and decay · reducing to linear form',
    'ln and e undo each other.',
    ['e: The base for which the gradient of e^x equals e^x; about 2.718.', 'Natural logarithm: ln x = log_e x, the inverse of e^x.', 'Exponential model: A quantity whose rate of change is proportional to its size.'],
    [
      sec(
        'e and ln',
        f('e^{ln x} = x', 'ln(e^x) = x', 'y = e^x  ⟺  x = ln y'),
        ul('y = e^x: through (0, 1), asymptote y = 0. y = ln x: through (1, 0), asymptote x = 0, defined only for x > 0.', 'To solve e^{2x} − 5e^x + 6 = 0, let u = e^x.', 'A model P = Ae^{kt} starts at A; it grows if k > 0 and decays if k < 0. As t → ∞ a decay model tends to its asymptote.'),
      ),
      sec(
        'Reducing to linear form',
        tbl(['Model', 'Take logs', 'Plot', 'Gradient', 'Intercept'], ['y = ax^n', 'log y = n log x + log a', 'log y against log x', 'n', 'log a'], ['y = ab^x', 'log y = x log b + log a', 'log y against x', 'log b', 'log a']),
        trap('The intercept is log a, not a. Undo the log at the end: a = 10^{intercept}.'),
      ),
    ],
  ),
  topic(
    'ma-p3-diff',
    'P3 · 5',
    'Further Differentiation',
    'Standard derivatives · the chain, product and quotient rules · dy/dx from dx/dy',
    'Differentiate the outside, then multiply by the derivative of the inside.',
    ['Chain rule: For a function of a function, dy/dx = dy/du × du/dx.', 'Product rule: For y = uv, dy/dx = u dv/dx + v du/dx.', 'Quotient rule: For y = u ÷ v, dy/dx = (v du/dx − u dv/dx) ÷ v^2.'],
    [
      sec(
        'Standard results',
        tbl(['y', 'dy/dx'], ['e^{kx}', 'ke^{kx}'], ['ln x', '1 ÷ x'], ['sin kx', 'k cos kx'], ['cos kx', '−k sin kx'], ['tan kx', 'k sec^2 kx'], ['a^x', 'a^x ln a'], ['sec x', 'sec x tan x'], ['cosec x', '−cosec x cot x'], ['cot x', '−cosec^2 x']),
        'Angles must be in **radians** for these results.',
      ),
      sec(
        'The three rules',
        f('y = (f(x))^n  ⟹  dy/dx = n(f(x))^{n−1} f′(x)', 'y = ln f(x)  ⟹  dy/dx = f′(x) ÷ f(x)', 'dy/dx = 1 ÷ (dx/dy)'),
        ul('Decide which rule applies before starting; many questions need two together.', 'After the product or quotient rule, **factorise** to find stationary points.', 'If x is given in terms of y, differentiate with respect to y and flip.'),
        trap('In the quotient rule the order on top matters: v du/dx comes first. Getting it backwards changes the sign.'),
      ),
    ],
  ),
  topic(
    'ma-p3-int',
    'P3 · 6',
    'Further Integration',
    'Standard integrals · reverse chain rule · integrals giving ln · using trigonometric identities',
    'Spot a function and its derivative.',
    ['Reverse chain rule: Recognising an integrand as the derivative of a composite function.', 'Standard integral: A result to be quoted, such as ∫ 1 ÷ x dx = ln|x| + c.'],
    [
      sec(
        'Standard results',
        tbl(['Integrand', 'Integral'], ['e^{kx}', 'e^{kx} ÷ k'], ['1 ÷ x', 'ln |x|'], ['sin kx', '−cos kx ÷ k'], ['cos kx', 'sin kx ÷ k'], ['sec^2 kx', 'tan kx ÷ k'], ['(ax + b)^n', '(ax + b)^{n+1} ÷ a(n + 1)']),
        'Each needs + c. Dividing by the coefficient works only when the inside is **linear**.',
      ),
      sec(
        'Patterns',
        f('∫ f′(x) ÷ f(x) dx = ln |f(x)| + c', '∫ f′(x) (f(x))^n dx = (f(x))^{n+1} ÷ (n + 1) + c'),
        ul('Guess the answer, differentiate it, and adjust the constant.', 'For sin^2 x or cos^2 x use the double-angle formulae: sin^2 x = ½(1 − cos 2x), cos^2 x = ½(1 + cos 2x).', 'tan^2 x = sec^2 x − 1, which integrates to tan x − x.'),
      ),
    ],
  ),
  topic(
    'ma-p3-numerical',
    'P3 · 7',
    'Numerical Methods',
    'Locating roots · iteration x_{n+1} = g(x_n) · staircase and cobweb diagrams',
    'Rearrange to x = g(x), then repeat.',
    ['Iteration: Feeding each output back in as the next input.', 'Converge: Get closer and closer to a fixed value.', 'Sign change: f(a) and f(b) having opposite signs, which traps a root of a continuous function.'],
    [
      sec(
        'Locating a root',
        'Show f changes sign over the interval and say that f is **continuous**, so a root lies between. To prove a root is correct to 2 d.p., test the two ends of the rounding interval: for 1.47 use 1.465 and 1.475.',
        trap('A sign change can be misleading: across a vertical asymptote there is a sign change without a root, and two close roots can hide with no sign change.'),
      ),
      sec(
        'Iteration',
        ol('Rearrange f(x) = 0 into x = g(x). Different rearrangements behave differently.', 'Start from the given x_0 and apply x_{n+1} = g(x_n).', 'Use the ANS key so no rounding error builds up.'),
        ul('The iteration converges to a root when |g′(x)| < 1 near it.', 'A **staircase** diagram: the values approach from one side. A **cobweb** diagram: they alternate either side.', 'Draw them by going vertically to the curve y = g(x), then horizontally to the line y = x.'),
      ),
    ],
  ),
];

const p4 = [
  topic(
    'ma-p4-partial',
    'P4 · 1–2',
    'Contradiction and Partial Fractions',
    'Proof by contradiction · splitting into partial fractions · repeated factors · improper fractions',
    'Assume the opposite, and find it cannot be.',
    ['Proof by contradiction: Assume the statement is false and show this leads to something impossible.', 'Partial fractions: A single fraction written as a sum of simpler ones.', 'Rational number: One that can be written a ÷ b with a and b integers, b ≠ 0.'],
    [
      sec(
        'Proof by contradiction',
        ol('Write "Assume that …" with the **negation** of the statement.', 'Reason from it until two facts contradict each other.', 'Conclude that the assumption is false, so the statement is true.'),
        'Classics: √2 is irrational (assume √2 = a ÷ b in lowest terms; both turn out even); there are infinitely many primes (multiply them all and add 1).',
      ),
      sec(
        'Partial fractions',
        tbl(['Denominator', 'Form'], ['(x + a)(x + b)', 'A ÷ (x + a) + B ÷ (x + b)'], ['(x + a)(x + b)^2', 'A ÷ (x + a) + B ÷ (x + b) + C ÷ (x + b)^2'], ['Improper', 'Divide first: quotient + proper fraction']),
        ul('Multiply through by the denominator, then **substitute** values of x that make brackets zero.', 'For a repeated factor, also compare coefficients for the last constant.'),
        tip('Partial fractions are the first step for integrating a rational function and for binomial expansions of one.'),
      ),
    ],
  ),
  topic(
    'ma-p4-parametric',
    'P4 · 3',
    'Parametric Equations',
    'Parametric curves · converting to Cartesian form · gradients · areas',
    'Two equations, one curve.',
    ['Parameter: A third variable, usually t or θ, in terms of which x and y are given.', 'Cartesian equation: One linking x and y directly.'],
    [
      sec(
        'Converting and sketching',
        ul('Algebraic: make t the subject of one equation and substitute into the other.', 'Trigonometric: use an identity. x = 3 cos t, y = 3 sin t gives x^2 + y^2 = 9.', 'The domain of the Cartesian form is the range of x(t); the range is the range of y(t).', 'Curve meets the x-axis where y = 0: solve for t, then find x.'),
      ),
      sec(
        'Calculus',
        f('dy/dx = (dy/dt) ÷ (dx/dt)', 'area = ∫ y (dx/dt) dt'),
        'Change the limits to values of **t** when integrating. For a tangent, find t at the point, then the gradient, then use y − y_1 = m(x − x_1).',
        trap('The limits for the area are t-values in the order that matches x increasing, not necessarily smaller t first.'),
      ),
    ],
  ),
  topic(
    'ma-p4-binomial',
    'P4 · 4',
    'The General Binomial Expansion',
    '(1 + x)^n for any rational n · validity · (a + bx)^n · using partial fractions',
    'Take the constant out first.',
    ['Infinite series: An expansion that does not end; it is valid only where it converges.', 'Valid: The range of x for which the expansion converges to the function.'],
    [
      sec(
        'The expansion',
        f('(1 + x)^n = 1 + nx + n(n − 1)x^2 ÷ 2! + n(n − 1)(n − 2)x^3 ÷ 3! + …', 'valid for |x| < 1'),
        f('(a + bx)^n = a^n (1 + bx ÷ a)^n,   valid for |x| < a ÷ |b|'),
        ul('For negative or fractional n the series never ends.', 'Replace x by the whole bracketed term, sign included.', 'For a product of two expansions the result is valid where **both** are.'),
        trap('(4 + x)^{1/2} is not 1 + ½x + …. Take out 4^{1/2} = 2 first: 2(1 + x ÷ 4)^{1/2}.'),
      ),
      sec(
        'Approximations',
        'Choose x small and inside the valid range so that the bracket becomes the number wanted. To approximate √(1.02) use (1 + x)^{1/2} with x = 0.02. A percentage error compares the estimate with the calculator value.',
      ),
    ],
  ),
  topic(
    'ma-p4-diff',
    'P4 · 5',
    'Implicit Differentiation and Rates',
    'Implicit differentiation · parametric differentiation · connected rates of change · forming differential equations',
    'Differentiate y as usual, then multiply by dy/dx.',
    ['Implicit equation: One where y is not given as the subject, such as x^2 + y^2 = 25.', 'Rate of change: A derivative with respect to time.', 'Differential equation: An equation involving a derivative.'],
    [
      sec(
        'Implicit differentiation',
        f('d/dx (y^n) = ny^{n−1} dy/dx', 'd/dx (xy) = x dy/dx + y'),
        ol('Differentiate every term with respect to x.', 'Use the product rule on mixed terms such as xy.', 'Collect the dy/dx terms and factorise.'),
        'Stationary points: set dy/dx = 0, get a relation between x and y, and substitute back into the original curve.',
      ),
      sec(
        'Connected rates',
        f('dV/dt = dV/dr × dr/dt'),
        'Write down what is given and what is wanted as derivatives, then build the chain that links them. "Rate proportional to" gives an equation with a constant k: "the rate of decrease of V is proportional to V" is dV/dt = −kV.',
      ),
    ],
  ),
  topic(
    'ma-p4-int',
    'P4 · 6',
    'Integration Techniques',
    'Substitution · integration by parts · partial fractions · volumes of revolution · differential equations',
    'Choose the method before you start.',
    ['Integration by parts: The reverse of the product rule.', 'Volume of revolution: The solid made by rotating a region about an axis.', 'Separation of variables: Collecting all y terms on one side and all x terms on the other before integrating.'],
    [
      sec(
        'Methods',
        f('∫ u (dv/dx) dx = uv − ∫ v (du/dx) dx', 'V = π ∫ y^2 dx'),
        tbl(['Integrand', 'Method'], ['A product such as x e^x, x sin x', 'By parts, u = the polynomial'], ['ln x', 'By parts with u = ln x, dv/dx = 1'], ['A rational function', 'Partial fractions, giving logs'], ['Contains a composite function', 'Substitution: replace x, dx and the limits'], ['sin^2, cos^2', 'Double-angle identities']),
        fig('area', 'Integration adds up thin strips; rotating each strip gives a disc of volume πy² dx.'),
        'For a parametric curve the volume is π ∫ y^2 (dx/dt) dt.',
      ),
      sec(
        'Differential equations',
        ol('Separate: (1 ÷ g(y)) dy = f(x) dx.', 'Integrate both sides, with one + c.', 'Use the boundary condition to find c.', 'Rearrange for y if asked.'),
        tip('When the answer has ln on both sides, write the constant as ln k so the logs combine neatly.'),
      ),
    ],
  ),
  topic(
    'ma-p4-vectors',
    'P4 · 7',
    'Vectors',
    'Vectors in three dimensions · the vector equation of a line · the scalar product · intersections and perpendicular distance',
    'A zero dot product means perpendicular.',
    ['Position vector: The vector from the origin to a point.', 'Scalar product: a·b = |a||b| cos θ, a number.', 'Skew lines: Lines that are not parallel and do not meet.', 'Direction vector: A vector parallel to a line.'],
    [
      sec(
        'Lines and angles',
        f('|a| = √(x^2 + y^2 + z^2)', 'r = a + λb', 'a·b = a_1 b_1 + a_2 b_2 + a_3 b_3 = |a||b| cos θ'),
        ul('Line through A and B: r = a + λ(b − a).', 'The angle between two lines is the angle between their **direction** vectors.', 'Perpendicular vectors: a·b = 0. Parallel: one is a multiple of the other.'),
      ),
      sec(
        'Intersections and distances',
        ol('Set the two line equations equal, giving three equations in λ and μ.', 'Solve two of them.', 'Check the third: if it holds, they meet; if not (and they are not parallel), they are skew.'),
        'Foot of the perpendicular from P to a line: write the general point X on the line, then solve PX·b = 0 for λ. The distance is |PX|.',
        trap('Use a different parameter for each line. With the same letter you are assuming they meet at the same parameter value.'),
      ),
    ],
  ),
];

const m2 = [
  topic(
    'ma-m2-kinematics',
    'M2 · 1',
    'Projectiles and Variable Acceleration',
    'Projectile motion · displacement, velocity and acceleration by calculus · motion in a plane with vectors',
    'Differentiate to go down, integrate to go up.',
    ['Projectile: A particle moving freely under gravity.', 'Variable acceleration: Acceleration that depends on time, so suvat does not apply.'],
    [
      sec(
        'Projectiles',
        f('x = ut cos α', 'y = ut sin α − ½gt^2'),
        ul('Horizontal velocity is constant; vertical motion has a = −g.', 'Time of flight: set y = 0. Greatest height: set vertical velocity = 0.', 'Speed at any moment is √(v_x^2 + v_y^2); direction is tan θ = v_y ÷ v_x.', 'Eliminating t gives the equation of the path, a parabola.'),
      ),
      sec(
        'Calculus',
        f('v = dr/dt,   a = dv/dt', 'r = ∫ v dt,   v = ∫ a dt'),
        ul('With i and j, differentiate or integrate each component separately.', 'Every integration brings a constant (a vector constant in two dimensions): find it from the initial conditions.', 'A particle is at rest when v = 0; it is moving parallel to i when the j component of v is zero.'),
        trap('Distance travelled is not displacement. If the velocity changes sign, integrate each part separately and add the sizes.'),
      ),
    ],
  ),
  topic(
    'ma-m2-com',
    'M2 · 2',
    'Centres of Mass',
    'Particles on a line and in a plane · standard laminas · composite shapes · suspended laminas',
    'Moment of the whole equals the sum of the moments of the parts.',
    ['Centre of mass: The point where the whole mass of a body can be taken to act.', 'Lamina: A flat body of negligible thickness.', 'Uniform: Having the same mass per unit area or length throughout.'],
    [
      sec(
        'Finding it',
        f('x̄ Σm = Σmx', 'ȳ Σm = Σmy'),
        tbl(['Shape', 'Centre of mass'], ['Uniform rod', 'Midpoint'], ['Rectangle', 'Where the diagonals cross'], ['Triangle', 'Two-thirds along a median from the vertex; mean of the three vertices'], ['Sector, radius r, angle 2α', '2r sin α ÷ 3α from the centre'], ['Circular arc, angle 2α', 'r sin α ÷ α from the centre']),
        'For a composite lamina use a table: mass (proportional to area), x, y for each part. A **removed** part has negative mass. A framework of wires uses lengths in place of areas.',
      ),
      sec(
        'Hanging and standing',
        ul('A freely suspended lamina hangs with its centre of mass **vertically below** the point of suspension: draw that line and find its angle with a side by trigonometry.', 'A lamina on an inclined plane is about to topple when the centre of mass is vertically above the lower corner.'),
        tip('Choose axes along two edges of the shape so most coordinates are easy.'),
      ),
    ],
  ),
  topic(
    'ma-m2-energy',
    'M2 · 3',
    'Work, Energy and Power',
    'Work done · kinetic and potential energy · the work–energy principle · power and driving force',
    'Energy lost is work done against resistance.',
    ['Work done: Force × distance moved in the direction of the force (J).', 'Kinetic energy: The energy of motion, ½mv^2 (J).', 'Potential energy: mgh above a chosen zero level.', 'Power: Rate of doing work (W).'],
    [
      sec(
        'Work and energy',
        f('work = Fs cos θ', 'KE = ½mv^2,   PE = mgh'),
        f('final KE + PE = initial KE + PE + work done by other forces'),
        'If no forces other than gravity do work, mechanical energy is conserved. Friction and resistance do **negative** work; a driving force does positive work. On a rough slope the work done against friction is μR × distance.',
      ),
      sec(
        'Power',
        f('P = Fv'),
        ol('Driving force F = P ÷ v.', 'Apply F = ma along the road: F − resistance − mg sin α = ma.', 'Maximum speed is when a = 0.'),
        trap('Use the speed at that instant. A constant power means the driving force falls as the speed rises, so the acceleration is not constant and suvat cannot be used.'),
      ),
    ],
  ),
  topic(
    'ma-m2-collisions',
    'M2 · 4',
    'Collisions',
    "Conservation of momentum · Newton's law of restitution · impact with a wall · successive impacts · energy loss",
    'e is speed of separation over speed of approach.',
    ['Coefficient of restitution: e, from 0 (inelastic, they coalesce) to 1 (perfectly elastic).', 'Speed of approach: The rate at which the gap between two particles closes.', 'Impulse: Change in momentum, mv − mu.'],
    [
      sec(
        'Two equations',
        f('m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2', 'e = (v_2 − v_1) ÷ (u_1 − u_2)'),
        ol('Draw before and after diagrams with every velocity in the **same** positive direction.', 'Write conservation of momentum.', 'Write the restitution equation.', 'Solve simultaneously.'),
        'Against a fixed smooth wall, the rebound speed is e × the approach speed.',
      ),
      sec(
        'Typical extensions',
        ul('Energy lost = total KE before − total KE after. It is zero only when e = 1.', 'Successive impacts: take the collisions one at a time. A further collision happens if the particle behind is moving faster than the one in front.', 'Conditions on e: use 0 ≤ e ≤ 1, or a statement such as "the direction is reversed" (v < 0), to form an inequality.'),
      ),
    ],
  ),
  topic(
    'ma-m2-statics',
    'M2 · 5',
    'Statics of Rigid Bodies',
    'Moments with forces at angles · ladders against walls · hinged rods · limiting friction',
    'Three equations: across, up, and moments.',
    ['Rigid body: One that does not change shape, so the point where each force acts matters.', 'Smooth: No friction, so the reaction is perpendicular to the surface.', 'Limiting equilibrium: Friction has reached its maximum, μR.'],
    [
      sec(
        'Equilibrium',
        f('moment = F × perpendicular distance = Fd sin θ', 'ΣF horizontal = 0,   ΣF vertical = 0,   Σ moments = 0'),
        'For a force at an angle either find the perpendicular distance to its line of action, or resolve the force into components and take the moment of each.',
      ),
      sec(
        'Ladders and hinges',
        ol('Draw the ladder with weight at its centre, a normal reaction at the wall and at the ground, and friction at each rough surface.', 'Resolve horizontally and vertically.', 'Take moments about the foot of the ladder, where most unknowns act.', 'In limiting equilibrium put F = μR.'),
        'At a hinge the force has unknown size and direction: write it as horizontal and vertical components X and Y. Take moments about the hinge to remove both.',
        tip('Friction at the ground acts **towards** the wall, since the foot of the ladder would slide away from it.'),
      ),
    ],
  ),
];

const s2 = [
  topic(
    'ma-s2-binomial',
    'S2 · 1',
    'The Binomial Distribution',
    'Conditions · probabilities · cumulative tables · mean and variance',
    'Fixed trials, two outcomes, constant p, independent.',
    ['Binomial distribution: X ~ B(n, p), the number of successes in n independent trials.', 'Cumulative probability: P(X ≤ x), as given in the tables.'],
    [
      sec(
        'The model',
        f('P(X = r) = nCr p^r (1 − p)^{n−r}', 'E(X) = np', 'Var(X) = np(1 − p)'),
        'Conditions: a fixed number of trials, each with two outcomes, a constant probability of success, and independent trials. Quote them **in context**.',
      ),
      sec(
        'Using tables',
        tbl(['Wanted', 'From tables'], ['P(X < 5)', 'P(X ≤ 4)'], ['P(X ≥ 5)', '1 − P(X ≤ 4)'], ['P(X > 5)', '1 − P(X ≤ 5)'], ['P(3 ≤ X ≤ 7)', 'P(X ≤ 7) − P(X ≤ 2)']),
        tip('Tables stop at p = 0.5. For p > 0.5 count failures instead: if X ~ B(20, 0.7) then Y = 20 − X ~ B(20, 0.3).'),
      ),
    ],
  ),
  topic(
    'ma-s2-poisson',
    'S2 · 2',
    'The Poisson Distribution',
    'Conditions · probabilities · scaling the mean · approximating the binomial',
    'Mean equals variance.',
    ['Poisson distribution: X ~ Po(λ), the number of events in a fixed interval when they occur at a constant average rate.', 'Rate: The mean number of events per unit of time or space.'],
    [
      sec(
        'The model',
        f('P(X = r) = e^{−λ} λ^r ÷ r!', 'E(X) = Var(X) = λ'),
        ul('Conditions: events occur **singly**, **independently** and at a **constant average rate**.', 'Scale λ with the interval: 3 per hour is 1.5 per half hour and 12 per four hours.', 'Sums of independent Poisson variables are Poisson with the means added.'),
      ),
      sec(
        'Approximating a binomial',
        'If n is large and p is small, B(n, p) ≈ Po(np). It works because then np ≈ np(1 − p), so mean ≈ variance.',
        trap('"At least 3" is P(X ≥ 3) = 1 − P(X ≤ 2). Being one out on the table value is the commonest error.'),
      ),
    ],
  ),
  topic(
    'ma-s2-crv',
    'S2 · 3–4',
    'Continuous Random Variables',
    'Probability density functions · cumulative distribution functions · mean, variance, median and mode · the continuous uniform distribution',
    'Area under the density curve is probability.',
    ['Probability density function: f(x) ≥ 0 with total area 1; probabilities are areas under it.', 'Cumulative distribution function: F(x) = P(X ≤ x).', 'Continuous uniform distribution: Every value between a and b is equally likely.'],
    [
      sec(
        'Density and distribution',
        f('∫ f(x) dx = 1 over all x', 'P(a < X < b) = ∫_a^b f(x) dx', 'F(x) = ∫ f(t) dt up to x,   f(x) = F′(x)'),
        f('E(X) = ∫ x f(x) dx', 'Var(X) = ∫ x^2 f(x) dx − (E(X))^2'),
        ul('Median m: F(m) = 0.5. Quartiles: F = 0.25 and 0.75.', 'Mode: where f(x) is greatest; differentiate, or look at the sketch.', 'For a piecewise f, build F piece by piece, adding the area already accumulated.', 'P(X = a) = 0, so < and ≤ give the same answer.'),
      ),
      sec(
        'Continuous uniform distribution',
        f('f(x) = 1 ÷ (b − a) for a ≤ x ≤ b', 'E(X) = (a + b) ÷ 2', 'Var(X) = (b − a)^2 ÷ 12'),
        'Probabilities are rectangles: width × height. A rounding error is a typical example: uniform on −0.5 to 0.5.',
      ),
    ],
  ),
  topic(
    'ma-s2-approx',
    'S2 · 5',
    'Normal Approximations',
    'Approximating the binomial and the Poisson by a normal · continuity corrections',
    'Discrete to continuous needs a half.',
    ['Continuity correction: Adjusting by 0.5 when a discrete distribution is approximated by a continuous one.'],
    [
      sec(
        'When and how',
        tbl(['Distribution', 'Condition', 'Approximation'], ['B(n, p)', 'n large, p close to 0.5', 'N(np, np(1 − p))'], ['Po(λ)', 'λ large (above about 10)', 'N(λ, λ)']),
        'Then standardise: Z = (x − μ) ÷ σ, remembering σ is the **square root** of the variance.',
      ),
      sec(
        'Continuity corrections',
        tbl(['Discrete', 'Normal'], ['P(X ≤ 7)', 'P(Y < 7.5)'], ['P(X < 7)', 'P(Y < 6.5)'], ['P(X ≥ 7)', 'P(Y > 6.5)'], ['P(X > 7)', 'P(Y > 7.5)'], ['P(X = 7)', 'P(6.5 < Y < 7.5)']),
        tip('First rewrite the event with ≤ or ≥ so it includes the whole numbers you want, then extend it by half a unit outward.'),
      ),
    ],
  ),
  topic(
    'ma-s2-sampling',
    'S2 · 6',
    'Populations and Samples',
    'Census and sample · sampling frames · statistics · sampling distributions',
    'A statistic is calculated from the sample alone.',
    ['Population: Every item of interest.', 'Census: A survey of every member of the population.', 'Sampling frame: A list identifying every sampling unit in the population.', 'Statistic: A quantity calculated only from the sample values, with no unknown parameters.', 'Sampling distribution: The probability distribution of a statistic over all possible samples.'],
    [
      sec(
        'Census or sample',
        tbl(['', 'Advantages', 'Disadvantages'], ['Census', 'Completely accurate; every item included', 'Slow, costly; impossible if testing destroys the item'], ['Sample', 'Quicker, cheaper, less data to handle', 'Subject to natural variation; may be biased']),
        'A simple random sample gives every possible sample of size n the same chance of being chosen. X̄ is a statistic; X̄ − μ is not, because μ is unknown.',
      ),
      sec(
        'Sampling distributions',
        ol('List every possible sample (order matters: (1, 2) and (2, 1) are different).', 'Find the probability of each by multiplying.', 'Work out the statistic (mean, median, mode, maximum …) for each.', 'Collect equal values and add their probabilities into a table.'),
      ),
    ],
  ),
  topic(
    'ma-s2-hypothesis',
    'S2 · 7',
    'Hypothesis Testing',
    'Null and alternative hypotheses · one- and two-tailed tests · critical regions · tests for a binomial proportion and a Poisson mean',
    'Assume H₀, then ask how surprising the data is.',
    ['Null hypothesis: H_0, the assumption being tested, always an equality.', 'Alternative hypothesis: H_1, what is suspected instead.', 'Significance level: The probability of rejecting H_0 when it is true.', 'Critical region: The set of values of the test statistic that lead to rejecting H_0.'],
    [
      sec(
        'The method',
        ol('State H_0: p = … (or λ = …) and H_1 with <, > or ≠.', 'State the distribution of the test statistic assuming H_0.', 'Find the probability of a result at least as extreme as the one observed, or find the critical region.', 'Compare with the significance level (halve it in each tail for a two-tailed test).', 'Conclude **in context**: "there is evidence that …" or "there is insufficient evidence that …".'),
        trap('Calculate P(X ≥ observed) or P(X ≤ observed), never P(X = observed).'),
      ),
      sec(
        'Critical regions',
        'For a discrete distribution the tail probability cannot hit the level exactly. Choose the region whose probability is as close as possible to (or just under, as the question says) the level. The **actual significance level** is the true probability of landing in the critical region.',
        tip('For a Poisson test, scale λ to the interval observed before doing anything else.'),
      ),
    ],
  ),
];

export const MATHS_A2: NoteUnit[] = [
  { id: 'p3', code: 'WMA13', name: 'Pure Mathematics 3', a2: true, topics: p3 },
  { id: 'p4', code: 'WMA14', name: 'Pure Mathematics 4', a2: true, topics: p4 },
  { id: 'm2', code: 'WME02', name: 'Mechanics 2', a2: true, topics: m2 },
  { id: 's2', code: 'WST02', name: 'Statistics 2', a2: true, topics: s2 },
];
