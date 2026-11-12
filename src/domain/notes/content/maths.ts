/** Maths: Pearson Edexcel International A Level, AS units P1, P2, M1 and S1. */
import { f, fig, ol, sec, tbl, tip, topic, trap, ul, type NoteSubject } from '../types';

const p1 = [
  topic(
    'ma-indices',
    'P1 · 1',
    'Indices and Surds',
    'Laws of indices · negative and fractional powers · simplifying surds · rationalising denominators',
    'A root is a fractional power.',
    ['Index: The power a base is raised to.', 'Surd: An irrational root left in exact form, such as √2.', 'Rationalise: Rewrite a fraction so its denominator has no surd.'],
    [
      sec(
        'Laws of indices',
        f('a^m × a^n = a^{m+n}', 'a^m ÷ a^n = a^{m−n}', '(a^m)^n = a^{mn}', 'a^0 = 1', 'a^{−n} = 1 ÷ a^n', 'a^{m/n} = (ⁿ√a)^m'),
        'To solve equations in powers, write both sides with the **same base**: 8^x = 4 becomes 2^{3x} = 2^2.',
        trap('(3x)^2 is 9x^2, not 3x^2. And 2x^{−1} is 2 ÷ x: the power belongs only to x.'),
      ),
      sec(
        'Surds',
        f('√(ab) = √a × √b', '√(a ÷ b) = √a ÷ √b'),
        ul('Simplify by pulling out square factors: √72 = √36 × √2 = 6√2.', 'Rationalise 1 ÷ √a by multiplying top and bottom by √a.', 'Rationalise 1 ÷ (a + √b) by multiplying by (a − √b), which gives a^2 − b underneath.'),
      ),
    ],
  ),
  topic(
    'ma-quadratics',
    'P1 · 1',
    'Quadratics',
    'Factorising · completing the square · the formula · the discriminant · sketching',
    'The discriminant counts the roots.',
    ['Root: A value of x for which f(x) = 0.', 'Discriminant: b^2 − 4ac, which tells how many real roots a quadratic has.', 'Turning point: The vertex of the parabola, a minimum if a > 0.'],
    [
      sec(
        'Three ways to solve',
        f('x = (−b ± √(b^2 − 4ac)) ÷ 2a', 'x^2 + bx + c = (x + b/2)^2 − (b/2)^2 + c'),
        ul('Factorise when you can; it is fastest.', 'Completed-square form a(x + p)^2 + q shows the turning point (−p, q) and the line of symmetry x = −p.', 'For ax^2 + bx + c take a out of the first two terms before completing the square.', 'Hidden quadratics: let u = x^2, u = √x or u = 2^x and solve for u first.'),
      ),
      sec(
        'The discriminant',
        tbl(['b^2 − 4ac', 'Roots', 'Graph'], ['> 0', 'Two distinct real roots', 'Crosses the x-axis twice'], ['= 0', 'One repeated root', 'Touches the x-axis'], ['< 0', 'No real roots', 'Never meets the x-axis']),
        tip('"Find the values of k for which the equation has two real roots" means: write the discriminant in terms of k, set it > 0, and solve the inequality.'),
      ),
    ],
  ),
  topic(
    'ma-equations',
    'P1 · 1',
    'Equations and Inequalities',
    'Simultaneous equations · linear and quadratic inequalities · regions',
    'Sketch the quadratic before writing the inequality.',
    ['Simultaneous equations: Equations that must hold together; the solutions are where the graphs meet.', 'Critical values: The roots of the related equation, where an inequality can change from true to false.'],
    [
      sec(
        'Simultaneous equations',
        ul('Two linear: eliminate or substitute.', 'One linear, one quadratic: rearrange the **linear** one and substitute into the quadratic. Give the answers as pairs.', 'The discriminant of the resulting quadratic tells how the line meets the curve: two points, a tangent, or no intersection.'),
      ),
      sec(
        'Inequalities',
        ol('Linear: solve like an equation, but **reverse the sign** when multiplying or dividing by a negative.', 'Quadratic: move everything to one side, find the critical values, sketch the parabola.', 'Below the axis (< 0) is the single interval between the roots; above (> 0) is the two outer parts, written with "or".'),
        f('x^2 − 5x + 4 < 0  ⟹  1 < x < 4', 'x^2 − 5x + 4 > 0  ⟹  x < 1 or x > 4'),
        'Regions: draw each boundary (dashed for < or >, solid for ≤ or ≥) and shade the side that satisfies it.',
        trap('Never divide an inequality by x: you do not know its sign. Multiply by x^2 or rearrange instead.'),
      ),
    ],
  ),
  topic(
    'ma-graphs',
    'P1 · 1',
    'Graphs and Transformations',
    'Cubic and reciprocal graphs · points of intersection · translations, stretches and reflections',
    'Inside the bracket acts on x, and does the opposite.',
    ['Asymptote: A line a curve approaches but never reaches.', 'Translation: A shift without change of shape.', 'Stretch: A scaling parallel to one axis.'],
    [
      sec(
        'Shapes to know',
        ul('Cubic y = ax^3 + …: for a > 0 it runs bottom-left to top-right. Factorised form shows the roots; a squared factor means the curve **touches** the axis there.', 'Reciprocal y = k ÷ x: two branches with asymptotes x = 0 and y = 0. For k > 0 they lie in the first and third quadrants.', 'y = k ÷ x^2: both branches above the axis for k > 0.'),
        'The number of intersections of two graphs is the number of real solutions of f(x) = g(x).',
      ),
      sec(
        'Transformations',
        tbl(['Function', 'Effect on the graph of y = f(x)'], ['f(x) + a', 'Up by a'], ['f(x + a)', 'Left by a'], ['a f(x)', 'Vertical stretch, scale factor a'], ['f(ax)', 'Horizontal stretch, scale factor 1 ÷ a'], ['−f(x)', 'Reflection in the x-axis'], ['f(−x)', 'Reflection in the y-axis']),
        tip('Track the key points (intercepts, turning points) and the asymptotes one at a time, and label them on the new sketch.'),
      ),
    ],
  ),
  topic(
    'ma-lines',
    'P1 · 2',
    'Straight Lines',
    'Gradient · equations of a line · parallel and perpendicular · midpoint and distance',
    'Perpendicular gradients multiply to −1.',
    ['Gradient: Change in y divided by change in x.', 'Perpendicular: At right angles; the gradients multiply to −1.', 'Collinear: Lying on the same straight line.'],
    [
      sec(
        'Equations of a line',
        f('m = (y_2 − y_1) ÷ (x_2 − x_1)', 'y − y_1 = m(x − x_1)', 'y = mx + c', 'ax + by + c = 0'),
        ul('Parallel lines have equal gradients.', 'Perpendicular lines: m_1 × m_2 = −1, so the other gradient is −1 ÷ m.', 'A line meets the x-axis where y = 0 and the y-axis where x = 0.'),
      ),
      sec(
        'Lengths, midpoints and areas',
        f('distance = √((x_2 − x_1)^2 + (y_2 − y_1)^2)', 'midpoint = ((x_1 + x_2) ÷ 2, (y_1 + y_2) ÷ 2)'),
        'For the area of a triangle, find the intercepts or a perpendicular height and use ½ × base × height. A perpendicular bisector passes through the midpoint with gradient −1 ÷ m.',
        tip('If asked for integer coefficients, multiply through to clear fractions and write ax + by + c = 0.'),
      ),
    ],
  ),
  topic(
    'ma-trig',
    'P1 · 3',
    'Trigonometric Ratios',
    'Sine rule · cosine rule · area of a triangle · graphs of sin, cos and tan',
    'Two sides and the angle between: cosine rule.',
    ['Sine rule: Links each side of a triangle to the sine of its opposite angle.', 'Cosine rule: Links three sides and one angle.', 'Period: The interval after which a graph repeats.'],
    [
      sec(
        'Triangles',
        f('a ÷ sin A = b ÷ sin B = c ÷ sin C', 'a^2 = b^2 + c^2 − 2bc cos A', 'area = ½ab sin C'),
        tbl(['Given', 'Use'], ['Two angles and a side, or two sides and a non-included angle', 'Sine rule'], ['Two sides and the included angle, or three sides', 'Cosine rule']),
        trap('The sine rule can give two possible angles (θ and 180° − θ). Check whether the obtuse one fits the triangle.'),
      ),
      sec(
        'The three graphs',
        tbl(['', 'sin x', 'cos x', 'tan x'], ['Period', '360°', '360°', '180°'], ['Range', '−1 to 1', '−1 to 1', 'All real values'], ['At 0°', '0', '1', '0'], ['Asymptotes', '—', '—', 'x = 90°, 270° …']),
        fig('unitcircle', 'As the point moves round the unit circle, its height is sin θ and its distance across is cos θ.'),
        'Exact values: sin 30° = ½, sin 45° = √2 ÷ 2, sin 60° = √3 ÷ 2, tan 45° = 1, tan 60° = √3.',
      ),
    ],
  ),
  topic(
    'ma-radians',
    'P1 · 3',
    'Radians',
    'Radian measure · arc length · area of a sector · area of a segment',
    'π radians is half a turn.',
    ['Radian: The angle at the centre of a circle subtended by an arc equal in length to the radius.', 'Sector: A slice of a circle between two radii.', 'Segment: The region between a chord and its arc.'],
    [
      sec(
        'Converting and measuring',
        f('π rad = 180°', 'arc length s = rθ', 'sector area A = ½r^2 θ', 'segment area = ½r^2 (θ − sin θ)'),
        ul('Degrees to radians: × π ÷ 180. Radians to degrees: × 180 ÷ π.', 'θ must be in **radians** in all three formulas.', 'Perimeter of a sector = 2r + rθ.'),
        trap('Set the calculator to radians before taking sin θ in the segment formula.'),
      ),
      sec(
        'Compound shapes',
        'Split the shape into sectors and triangles. A triangle formed by two radii has area ½r^2 sin θ; subtract it from the sector to get the segment.',
        tip('Keep answers exact (in terms of π) until the last line unless told to round.'),
      ),
    ],
  ),
  topic(
    'ma-diff1',
    'P1 · 4',
    'Differentiation',
    'The gradient function · differentiating x^n · tangents and normals · the second derivative',
    'Multiply by the power, then take one off the power.',
    ['Derivative: The gradient function dy/dx, the rate of change of y with respect to x.', 'Tangent: The straight line that touches a curve at a point, with the same gradient.', 'Normal: The line perpendicular to the tangent at that point.'],
    [
      sec(
        'The rule',
        f('y = ax^n  ⟹  dy/dx = anx^{n−1}'),
        fig('tangent', 'The chord through two points swings onto the tangent as the points close up: that limit is the derivative.'),
        ul('Differentiate term by term; a constant differentiates to 0.', 'Rewrite first: 1 ÷ x^2 = x^{−2}, √x = x^{1/2}; expand brackets and divide through fractions.', 'f′(x) and dy/dx mean the same thing; f″(x) or d^2y/dx^2 is the derivative of the derivative.'),
      ),
      sec(
        'Tangents and normals',
        ol('Differentiate.', 'Substitute the x-value to get the gradient m.', 'Tangent: y − y_1 = m(x − x_1). Normal: use gradient −1 ÷ m.'),
        tip('To find where the gradient has a given value, set dy/dx equal to it and solve for x.'),
      ),
    ],
  ),
  topic(
    'ma-int1',
    'P1 · 5',
    'Integration',
    'Integration as the reverse of differentiation · integrating x^n · finding the constant',
    'Add one to the power, divide by the new power, add c.',
    ['Indefinite integral: The family of functions whose derivative is the integrand, written with + c.', 'Constant of integration: The unknown constant c that differentiation removes.'],
    [
      sec(
        'The rule',
        f('∫ ax^n dx = ax^{n+1} ÷ (n + 1) + c,  n ≠ −1'),
        ul('Integrate term by term, after rewriting roots and fractions as powers of x.', 'Check by differentiating your answer.'),
        trap('Forgetting + c loses a mark every time on an indefinite integral.'),
      ),
      sec(
        'Finding the curve',
        'Given dy/dx and a point on the curve: integrate, then substitute the point to find c.',
        f('dy/dx = 6x^2 − 4,  through (1, 5)', 'y = 2x^3 − 4x + c', '5 = 2 − 4 + c  ⟹  c = 7'),
      ),
    ],
  ),
];

const p2 = [
  topic(
    'ma-algebra2',
    'P2 · 1–2',
    'Proof and Algebraic Methods',
    'Proof by deduction, exhaustion and counter-example · algebraic division · factor and remainder theorems',
    'f(a) = 0 means (x − a) is a factor.',
    ['Proof by deduction: Reasoning from known facts through logical steps to the result.', 'Proof by exhaustion: Checking every possible case.', 'Counter-example: One case that shows a statement is false.', 'Factor theorem: (x − a) is a factor of f(x) exactly when f(a) = 0.'],
    [
      sec(
        'Proof',
        ul('Deduction: use algebra. Even numbers are 2n, odd are 2n + 1, consecutive integers n and n + 1.', 'Exhaustion: split into cases (e.g. n even, n odd) and prove each.', 'Disproof: a single counter-example is enough.', 'End with a sentence stating what has been shown.'),
        trap('Trying a few numbers is not a proof. It only proves those numbers.'),
      ),
      sec(
        'Factor and remainder theorems',
        f('f(a) = 0  ⟺  (x − a) is a factor', 'remainder when f(x) ÷ (x − a) is f(a)', 'for (ax − b) use f(b ÷ a)'),
        ol('Try small values (±1, ±2, ±3 …) until f(a) = 0.', 'Divide f(x) by (x − a) by long division or by comparing coefficients.', 'Factorise the quadratic that is left.'),
        tip('To find unknown coefficients, use each fact given (a factor, a remainder) to write an equation and solve them together.'),
      ),
    ],
  ),
  topic(
    'ma-circles',
    'P2 · 3',
    'Circles',
    'Equation of a circle · centre and radius · tangents, chords and the circle theorems',
    'A tangent meets the radius at 90°.',
    ['Chord: A line segment joining two points on a circle.', 'Tangent: A line touching the circle at exactly one point.', 'Circumcircle: The circle through all three vertices of a triangle.'],
    [
      sec(
        'The equation',
        f('(x − a)^2 + (y − b)^2 = r^2'),
        'Centre (a, b), radius r. An expanded equation x^2 + y^2 + 2fx + 2gy + c = 0 is turned back by **completing the square** in x and in y.',
      ),
      sec(
        'Three facts that solve most questions',
        ul('The tangent is perpendicular to the radius at the point of contact: find the radius gradient, take −1 ÷ m.', 'The perpendicular bisector of any chord passes through the centre.', 'The angle in a semicircle is 90°: if AB is a diameter and P is on the circle, AP ⟂ BP.'),
        'Line and circle: substitute the line into the circle and use the discriminant: > 0 two points, = 0 tangent, < 0 no intersection.',
        tip('The length of a tangent from an outside point comes from Pythagoras with the radius and the distance to the centre.'),
      ),
    ],
  ),
  topic(
    'ma-logs',
    'P2 · 5',
    'Exponentials and Logarithms',
    'Graphs of a^x · laws of logarithms · solving a^x = b · change of base',
    'A logarithm is a power.',
    ['Exponential function: y = a^x with a > 0; passes through (0, 1).', 'Logarithm: log_a n = x means a^x = n.', 'Base: The number being raised to the power.'],
    [
      sec(
        'Laws of logarithms',
        f('log_a (xy) = log_a x + log_a y', 'log_a (x ÷ y) = log_a x − log_a y', 'log_a (x^k) = k log_a x', 'log_a a = 1,   log_a 1 = 0', 'log_a x = log_b x ÷ log_b a'),
        'y = a^x has the x-axis as an asymptote; for a > 1 it grows, for 0 < a < 1 it decays. y = log_a x is its reflection in y = x.',
        trap('log(x + y) is **not** log x + log y. The laws are for products, quotients and powers only.'),
      ),
      sec(
        'Solving equations',
        ul('a^x = b: take logs of both sides, x = log b ÷ log a.', 'Powers on both sides: take logs, bring the powers down, collect the x terms.', 'A quadratic in a^x: let u = a^x. Reject negative u, since a^x > 0.', 'Log equations: combine into a single log, then rewrite as a power.'),
        tip('Check every answer in the original equation: you cannot take the log of zero or a negative number.'),
      ),
    ],
  ),
  topic(
    'ma-binomial',
    'P2 · 4',
    'The Binomial Expansion',
    "Pascal's triangle · factorials and nCr · expanding (a + b)^n for a positive integer n · approximations",
    'Powers of a fall as powers of b rise.',
    ['Factorial: n! = n × (n − 1) × … × 1, with 0! = 1.', 'Binomial coefficient: nCr = n! ÷ (r!(n − r)!), the number of ways to choose r from n.'],
    [
      sec(
        'The expansion',
        f('(a + b)^n = a^n + nC1 a^{n−1} b + nC2 a^{n−2} b^2 + … + b^n', '(1 + x)^n = 1 + nx + n(n − 1)x^2 ÷ 2! + n(n − 1)(n − 2)x^3 ÷ 3! + …'),
        ul('The general term is nCr a^{n−r} b^r.', 'Keep brackets: in (2 − 3x)^5 the "b" is (−3x), sign and coefficient included.', 'To find a coefficient in a product such as (1 + x)(2 − x)^6, collect every pair of terms that makes the power you want.'),
      ),
      sec(
        'Approximations',
        'Substitute a small x into the first few terms: to estimate 1.02^8 use (1 + x)^8 with x = 0.02.',
        trap('(3x)^2 = 9x^2. The most common lost mark is leaving the coefficient out of the power.'),
      ),
    ],
  ),
  topic(
    'ma-sequences',
    'P2 · 4',
    'Sequences and Series',
    'Arithmetic and geometric sequences · sums · sum to infinity · sigma notation · recurrence relations',
    'Arithmetic adds. Geometric multiplies.',
    ['Arithmetic sequence: Each term differs from the last by a common difference d.', 'Geometric sequence: Each term is the last multiplied by a common ratio r.', 'Series: The sum of the terms of a sequence.', 'Recurrence relation: A rule giving each term from the one before.'],
    [
      sec(
        'Arithmetic',
        f('u_n = a + (n − 1)d', 'S_n = ½n(2a + (n − 1)d) = ½n(a + l)'),
        'l is the last term. Two facts about the sequence give two equations in a and d.',
      ),
      sec(
        'Geometric',
        f('u_n = ar^{n−1}', 'S_n = a(1 − r^n) ÷ (1 − r)', 'S_∞ = a ÷ (1 − r),  |r| < 1'),
        fig('gp', 'Each bar is half the one before. The total creeps towards a limit but never passes it: the sum to infinity.'),
        ul('Divide one term by another to remove a and find r.', 'To find n in an inequality such as S_n > 1000, use logs. Dividing by the log of a number below 1 **reverses** the inequality.'),
      ),
      sec(
        'Sigma and recurrences',
        'Σ from r = 1 to n means add the terms for each r. Work out the first few to see whether the series is arithmetic or geometric.',
        'A sequence u_{n+1} = f(u_n) is **increasing** if every u_{n+1} > u_n, **decreasing** if every u_{n+1} < u_n, and **periodic** if it repeats; the order is the length of the cycle.',
      ),
    ],
  ),
  topic(
    'ma-trig2',
    'P2 · 6',
    'Trigonometric Identities and Equations',
    'tan θ = sin θ ÷ cos θ · sin²θ + cos²θ = 1 · solving equations in a given interval',
    'Find one answer, then find the rest from the graph.',
    ['Identity: An equation true for every value of the variable (≡).', 'Principal value: The single answer a calculator gives for an inverse trig function.'],
    [
      sec(
        'The two identities',
        f('tan θ ≡ sin θ ÷ cos θ', 'sin^2 θ + cos^2 θ ≡ 1'),
        'Use the second to turn an equation mixing sin^2 and cos into a quadratic in one function.',
      ),
      sec(
        'Solving in an interval',
        tbl(['Equation', 'Other solutions from the principal value θ'], ['sin x = k', '180° − θ, then ± 360°'], ['cos x = k', '360° − θ (or −θ), then ± 360°'], ['tan x = k', 'θ ± 180°']),
        ol('For sin(2x + 30°) = k, first change the interval to fit 2x + 30°.', 'List every solution for the bracket in that interval.', 'Then undo the bracket to get x.'),
        trap('Do not divide through by sin x or cos x: you lose the solutions where it is zero. Factorise instead.'),
        'In radians the same rules hold with π in place of 180°.',
      ),
    ],
  ),
  topic(
    'ma-diff2',
    'P2 · 7',
    'Stationary Points',
    'Increasing and decreasing functions · stationary points · maxima and minima · optimisation problems',
    'Zero gradient: a maximum, a minimum, or a point of inflection.',
    ['Stationary point: A point where dy/dx = 0.', 'Increasing function: dy/dx ≥ 0 over the interval.', 'Decreasing function: dy/dx ≤ 0 over the interval.'],
    [
      sec(
        'Finding and classifying',
        ol('Differentiate and solve dy/dx = 0.', 'Substitute back to get the y-coordinates.', 'Differentiate again and test each point.'),
        tbl(['d^2y/dx^2', 'Nature'], ['> 0', 'Minimum'], ['< 0', 'Maximum'], ['= 0', 'Not decided: check the gradient either side']),
        'A function is increasing where dy/dx > 0: solve that inequality for the interval.',
      ),
      sec(
        'Optimisation',
        ol('Write the quantity to be maximised or minimised as a formula.', 'Use the constraint to remove one variable.', 'Differentiate, set to zero, solve.', 'Justify with the second derivative and answer the question asked.'),
        tip('"Show that the value is a minimum" needs the second derivative evaluated and the words "> 0, so minimum".'),
      ),
    ],
  ),
  topic(
    'ma-int2',
    'P2 · 8',
    'Definite Integration and Areas',
    'Definite integrals · area under a curve · area between a curve and a line · the trapezium rule',
    'Top limit minus bottom limit.',
    ['Definite integral: An integral between two limits; it gives a number, with no + c.', 'Trapezium rule: A numerical estimate of an area using strips of equal width.'],
    [
      sec(
        'Areas',
        f('∫_a^b f(x) dx = F(b) − F(a)'),
        fig('area', 'Thinner and thinner strips fill the region under the curve: their total area tends to the integral.'),
        ul('Area below the x-axis comes out **negative**. If a curve crosses the axis, integrate each part separately and add the sizes.', 'Between a curve and a line: integrate (top − bottom) between the points of intersection, or take a triangle or trapezium off the curve’s area.'),
      ),
      sec(
        'The trapezium rule',
        f('∫ ≈ ½h (y_0 + y_n + 2(y_1 + y_2 + … + y_{n−1}))', 'h = (b − a) ÷ n'),
        ul('n strips need n + 1 ordinates.', 'It over-estimates where the curve bends upwards (convex) and under-estimates where it bends downwards.', 'More strips give a better estimate.'),
        trap('h is the strip **width**, not the number of strips.'),
      ),
    ],
  ),
];

const m1 = [
  topic(
    'ma-m1-kinematics',
    'M1 · 2',
    'Kinematics',
    'Modelling assumptions · constant acceleration · vertical motion under gravity · speed–time graphs',
    'Draw the diagram. Mark the positive direction.',
    ['Particle: A body whose size is ignored, so its mass acts at a point.', 'Light: Having no mass (a light string).', 'Inextensible: Does not stretch, so connected particles share an acceleration.', 'Smooth: Without friction.'],
    [
      sec(
        'Modelling words',
        tbl(['Word', 'What it lets you assume'], ['Particle', 'No air resistance or rotation; weight acts at one point'], ['Light string or rod', 'Tension is the same throughout'], ['Inextensible string', 'Both ends have the same speed and acceleration'], ['Smooth pulley or surface', 'No friction; tension equal either side of a pulley'], ['Uniform rod', 'Weight acts at the midpoint']),
      ),
      sec(
        'Constant acceleration',
        f('v = u + at', 's = ½(u + v)t', 's = ut + ½at^2', 's = vt − ½at^2', 'v^2 = u^2 + 2as'),
        ul('Vertical motion: a = g = 9.8 m s^{−2} downwards (M1 uses 9.8; give answers to 2 or 3 s.f.).', 'Speed–time graph: gradient is acceleration, area is distance.', 'Two-stage journeys: the final velocity of one stage is the initial velocity of the next.', 'Two particles meeting: same position at the same time, so equate displacements.'),
        tip('For a speed–time graph question, write the area as a trapezium in terms of the unknown time and set it equal to the distance.'),
      ),
    ],
  ),
  topic(
    'ma-m1-vectors',
    'M1 · 6',
    'Vectors in Mechanics',
    'i and j notation · magnitude and direction · position vectors · velocity and bearings',
    'Position now = start + velocity × time.',
    ['Unit vectors: i points east (x) and j north (y), each of length 1.', 'Position vector: The vector from the origin to a point.', 'Speed: The magnitude of the velocity vector.'],
    [
      sec(
        'Working with i and j',
        f('|ai + bj| = √(a^2 + b^2)', 'r = r_0 + vt', 'v = u + at', 'F = ma'),
        ul('Direction: tan θ = b ÷ a from the i direction; draw it to get the quadrant, then convert to a bearing (clockwise from north).', 'Parallel vectors are multiples of each other: equate the ratio of components.', 'A vector of magnitude k in the direction of v is k × v ÷ |v|.'),
      ),
      sec(
        'Two moving objects',
        ul('Write each position vector at time t.', 'They collide if **both** components agree for the same t.', 'The vector from A to B is b − a; its magnitude is the distance between them.', 'B is due north of A when their i components are equal.'),
        trap('Velocity is a vector; speed is its magnitude. "Find the speed" needs Pythagoras.'),
      ),
    ],
  ),
  topic(
    'ma-m1-dynamics',
    'M1 · 3',
    'Dynamics',
    'F = ma · friction · inclined planes · connected particles and pulleys',
    'Resolve along the motion and perpendicular to it.',
    ['Normal reaction: The contact force perpendicular to a surface, R.', 'Friction: Opposes motion along the surface; at most μR.', 'Coefficient of friction: μ, the ratio of limiting friction to normal reaction.', 'Limiting equilibrium: On the point of moving, so friction is at its maximum.'],
    [
      sec(
        'Friction and slopes',
        f('F = ma', 'F ≤ μR', 'F_{max} = μR'),
        ul('On a slope at angle α, weight has components mg sin α **down the slope** and mg cos α **into the slope**.', 'Perpendicular to the slope there is no acceleration, so R = mg cos α (plus or minus any other perpendicular components).', 'Friction acts against the motion, or against the way the particle would slide.'),
        trap('R = mg only on a horizontal surface with no other vertical forces. A force pulling upwards at an angle reduces R.'),
      ),
      sec(
        'Connected particles',
        ol('Draw the forces on each particle separately.', 'Write F = ma for each, in the direction it moves.', 'Add the equations: the tension cancels, giving the acceleration.', 'Substitute back for the tension.'),
        'When the string breaks or goes slack, the tension disappears and each particle moves on under its own forces. The force on a pulley is the resultant of the two tensions.',
        tip('A car towing a trailer: treat them as one object to find the acceleration, then just the trailer to find the tension in the tow-bar.'),
      ),
    ],
  ),
  topic(
    'ma-m1-momentum',
    'M1 · 4',
    'Momentum and Impulse',
    'Momentum · impulse · conservation of momentum · collisions and jerking strings',
    'Impulse is the change in momentum.',
    ['Momentum: mv (N s), a vector.', 'Impulse: Force × time, equal to the change in momentum (N s).'],
    [
      sec(
        'The two principles',
        f('I = Ft = mv − mu', 'm_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2'),
        ul('Choose a positive direction and keep it for the whole question.', 'In a collision the impulses on the two particles are equal and opposite.', 'Particles that coalesce move off with one shared velocity.', 'A string that jerks taut acts like a collision: both particles then share a speed.'),
        trap('If a particle rebounds, its velocity changes sign. The change in momentum is then m(v + u) in size, not m(v − u).'),
      ),
      sec(
        'Method',
        ol('Draw "before" and "after" diagrams with arrows for velocities.', 'Conservation of momentum gives the unknown speed.', 'Impulse on one particle = its own change in momentum.'),
        tip('State the magnitude of an impulse as a positive number with units N s.'),
      ),
    ],
  ),
  topic(
    'ma-m1-statics',
    'M1 · 5',
    'Statics of a Particle',
    'Resolving forces · equilibrium · limiting friction on planes',
    'In equilibrium every direction balances.',
    ['Equilibrium: The resultant force is zero, so there is no acceleration.', 'Resolve: Split a force into perpendicular components.'],
    [
      sec(
        'Equilibrium',
        f('F at θ to a direction has component F cos θ along it', 'and F sin θ perpendicular to it'),
        ol('Draw a clear force diagram.', 'Resolve in two perpendicular directions (horizontal and vertical, or along and perpendicular to a plane).', 'Set the total in each direction to zero and solve.'),
        'Three forces in equilibrium also form a closed triangle, so the sine and cosine rules can be used.',
      ),
      sec(
        'Friction problems',
        ul('"On the point of sliding" or "limiting equilibrium" means F = μR.', 'Decide which way the particle would move; friction opposes that.', 'For the range of a force P that keeps a particle at rest on a slope, do two cases: about to slide down (friction up) and about to slide up (friction down).'),
      ),
    ],
  ),
  topic(
    'ma-m1-moments',
    'M1 · 5',
    'Moments',
    'Moment of a force · equilibrium of rods · non-uniform rods · tilting',
    'About to tilt: the other support carries nothing.',
    ['Moment: Force × perpendicular distance from the point (N m).', 'Uniform rod: Its weight acts at the centre.', 'Non-uniform rod: The centre of mass is not at the midpoint; its position is an unknown.'],
    [
      sec(
        'Rods in equilibrium',
        f('clockwise moments = anticlockwise moments', 'total up = total down'),
        fig('moments', 'Moments about the pivot balance: force × distance on one side equals force × distance on the other.'),
        ul('Take moments about a point where an unknown force acts to remove it from the equation.', 'Resolve vertically for the second equation.', 'Two supports give two reactions; do not assume they are equal.'),
      ),
      sec(
        'Tilting and non-uniform rods',
        ul('On the point of tilting about one support, the reaction at the other support is **zero**.', 'For a non-uniform rod, call the distance to the centre of mass x and take moments twice to find it.'),
        tip('Mark every distance on the diagram from one end of the rod, then work out the distances to the pivot.'),
      ),
    ],
  ),
];

const s1 = [
  topic(
    'ma-s1-data',
    'S1 · 2',
    'Representing and Summarising Data',
    'Mean and standard deviation · median and quartiles · histograms · box plots · outliers · skewness · coding',
    'Area, not height, shows frequency in a histogram.',
    ['Standard deviation: A measure of spread about the mean; the square root of the variance.', 'Interquartile range: Q_3 − Q_1, the spread of the middle half.', 'Outlier: A value far from the rest, by a rule given in the question.', 'Skewness: The lack of symmetry of a distribution.'],
    [
      sec(
        'Location and spread',
        f('x̄ = Σx ÷ n   or   Σfx ÷ Σf', 'variance = Σx^2 ÷ n − x̄^2', 'σ = √variance'),
        ul('Grouped data: use class midpoints for the mean; use **linear interpolation** for the median and quartiles.', 'Coding y = (x − a) ÷ b: then x̄ = bȳ + a and σ_x = bσ_y. Adding a constant does not change the spread.', 'Outliers are usually beyond Q_1 − 1.5 × IQR or Q_3 + 1.5 × IQR.'),
      ),
      sec(
        'Diagrams and skew',
        f('frequency density = frequency ÷ class width'),
        ul('Histogram: continuous data, no gaps, **area** proportional to frequency.', 'Box plot: lowest value, Q_1, Q_2, Q_3, highest value, with outliers marked separately.'),
        tbl(['Skew', 'Quartiles', 'Averages'], ['Positive', 'Q_3 − Q_2 > Q_2 − Q_1', 'mean > median > mode'], ['Negative', 'Q_3 − Q_2 < Q_2 − Q_1', 'mean < median < mode'], ['Symmetric', 'Equal', 'All about equal']),
        tip('When comparing two distributions, make one comment on location and one on spread, both in context.'),
      ),
    ],
  ),
  topic(
    'ma-s1-probability',
    'S1 · 3',
    'Probability',
    'Venn diagrams · the addition rule · conditional probability · independence · tree diagrams',
    '"Given" shrinks the sample space.',
    ['Mutually exclusive: Events that cannot happen together, P(A ∩ B) = 0.', 'Independent: One event does not change the probability of the other.', 'Conditional probability: P(A | B), the probability of A given that B has happened.', 'Complement: A′, the event "not A"; P(A′) = 1 − P(A).'],
    [
      sec(
        'The rules',
        f('P(A ∪ B) = P(A) + P(B) − P(A ∩ B)', 'P(A | B) = P(A ∩ B) ÷ P(B)', 'independent  ⟺  P(A ∩ B) = P(A) × P(B)'),
        ul('Fill a Venn diagram from the **middle outwards**.', 'On a tree, multiply along branches and add between routes. Second-stage branches are conditional probabilities.', 'To test independence, compare P(A ∩ B) with P(A) × P(B), or P(A | B) with P(A), and say what you found.'),
        trap('Mutually exclusive and independent are different things. Mutually exclusive events with non-zero probabilities are never independent.'),
      ),
      sec(
        'Conditional questions',
        'For "given that", the denominator is the probability of the condition: add every route on the tree that satisfies it, and put the route you want on top.',
      ),
    ],
  ),
  topic(
    'ma-s1-correlation',
    'S1 · 4',
    'Correlation and Regression',
    'Scatter diagrams · the product moment correlation coefficient · the least-squares regression line · coding',
    'Correlation is not causation.',
    ['Correlation coefficient: r, a measure of the strength of linear association, from −1 to 1.', 'Explanatory variable: The independent variable, set or controlled (x).', 'Response variable: The dependent variable, measured (y).', 'Extrapolation: Estimating outside the range of the data; unreliable.'],
    [
      sec(
        'Correlation',
        f('S_{xx} = Σx^2 − (Σx)^2 ÷ n', 'S_{xy} = Σxy − ΣxΣy ÷ n', 'r = S_{xy} ÷ √(S_{xx} S_{yy})'),
        ul('r near 1: strong positive linear correlation; near −1: strong negative; near 0: little or no **linear** correlation.', 'Linear coding of either variable (with a positive multiplier) does not change r.', 'Interpret in context: "as temperature rises, sales tend to rise".'),
      ),
      sec(
        'Regression',
        f('y = a + bx', 'b = S_{xy} ÷ S_{xx}', 'a = ȳ − bx̄'),
        ul('The line passes through (x̄, ȳ).', 'b is the change in y for each unit increase in x; a is the value of y when x = 0. Interpret both in context.', 'Only predict within the range of the data (interpolation).', 'If the data were coded, substitute the coding back to get the line for the original variables.'),
      ),
    ],
  ),
  topic(
    'ma-s1-drv',
    'S1 · 5',
    'Discrete Random Variables',
    'Probability distributions · the cumulative distribution function · expectation and variance · the discrete uniform distribution',
    'The probabilities add up to 1.',
    ['Random variable: A variable whose value depends on the outcome of an experiment.', 'Expectation: E(X), the long-run mean value.', 'Cumulative distribution function: F(x) = P(X ≤ x).'],
    [
      sec(
        'Expectation and variance',
        f('Σ P(X = x) = 1', 'E(X) = Σ x P(X = x)', 'E(X^2) = Σ x^2 P(X = x)', 'Var(X) = E(X^2) − (E(X))^2'),
        f('E(aX + b) = aE(X) + b', 'Var(aX + b) = a^2 Var(X)'),
        trap('Var(3 − 2X) = 4 Var(X). The constant vanishes and the multiplier is squared, so the variance is never negative.'),
      ),
      sec(
        'Discrete uniform distribution',
        'Each of the values 1, 2, …, n is equally likely, like a fair die.',
        f('E(X) = (n + 1) ÷ 2', 'Var(X) = (n^2 − 1) ÷ 12'),
        tip('Unknown probabilities in a table: use Σp = 1 and the given E(X) as two simultaneous equations.'),
      ),
    ],
  ),
  topic(
    'ma-s1-normal',
    'S1 · 6',
    'The Normal Distribution',
    'The normal curve · standardising · using tables · finding μ and σ',
    'Standardise, sketch, then use the table.',
    ['Normal distribution: A symmetric, bell-shaped continuous distribution, X ~ N(μ, σ^2).', 'Standard normal: Z ~ N(0, 1).', 'Standardise: Convert x to z = (x − μ) ÷ σ.'],
    [
      sec(
        'Finding probabilities',
        f('Z = (X − μ) ÷ σ', 'P(Z < z) = Φ(z)', 'P(Z > z) = 1 − Φ(z)', 'Φ(−z) = 1 − Φ(z)'),
        fig('normal', 'The shaded area to the left of z is Φ(z). The whole area under the curve is 1.'),
        ul('Mean = median = mode = μ; about 68% of values lie within one σ of the mean, 95% within two.', 'Always sketch the curve and shade the area wanted.', 'Between two values: P(a < Z < b) = Φ(b) − Φ(a).'),
      ),
      sec(
        'Working backwards',
        'Given a probability, use the **percentage points table** to find z, then x = μ + zσ. If the probability is below 0.5 for "less than", z is negative.',
        'Two unknowns (μ and σ): write x = μ + zσ for each fact and solve simultaneously.',
        trap('N(μ, σ²) gives the **variance**. For N(50, 16) the standard deviation is 4.'),
      ),
    ],
  ),
];

export const MATHS: NoteSubject = {
  id: 'maths',
  name: 'Maths',
  study: 'Maths',
  board: 'Edexcel International A Level',
  hue: 8,
  units: [
    { id: 'p1', code: 'WMA11', name: 'Pure Mathematics 1', topics: p1 },
    { id: 'p2', code: 'WMA12', name: 'Pure Mathematics 2', topics: p2 },
    { id: 'm1', code: 'WME01', name: 'Mechanics 1', topics: m1 },
    { id: 's1', code: 'WST01', name: 'Statistics 1', topics: s1 },
  ],
};

