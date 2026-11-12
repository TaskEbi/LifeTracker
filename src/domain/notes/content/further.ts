/** Further Maths: Pearson Edexcel International A Level, AS unit F1 (WFM01). */
import { code, f, fig, ol, sec, tbl, tip, topic, trap, ul, type NoteSubject } from '../types';

const f1 = [
  topic(
    'fm-complex',
    'F1 · 1',
    'Complex Numbers',
    'i and a + bi · arithmetic and conjugates · the Argand diagram · modulus and argument · roots of polynomials',
    'Complex roots come in conjugate pairs.',
    ['Imaginary unit: i, where i^2 = −1.', 'Complex conjugate: z* = a − bi for z = a + bi.', 'Modulus: |z| = √(a^2 + b^2), the distance from the origin.', 'Argument: arg z, the angle from the positive real axis, −π < θ ≤ π.'],
    [
      sec(
        'Arithmetic',
        f('(a + bi)(c + di) = (ac − bd) + (ad + bc)i', 'zz* = a^2 + b^2', '(a + bi) ÷ (c + di): multiply top and bottom by (c − di)'),
        'Two complex numbers are equal only if their real parts **and** their imaginary parts are equal, which gives two equations from one.',
      ),
      sec(
        'Argand diagram, modulus and argument',
        f('|z| = √(a^2 + b^2)', 'tan θ = b ÷ a', 'z = r(cos θ + i sin θ)', '|z_1 z_2| = |z_1||z_2|,   arg(z_1 z_2) = arg z_1 + arg z_2'),
        fig('argand', 'Multiplying by i turns a complex number through a quarter turn about the origin without changing its modulus.'),
        trap('Find the argument from a sketch. tan⁻¹(b ÷ a) gives the right angle only in the first and fourth quadrants; in the second add π, in the third subtract π.'),
      ),
      sec(
        'Roots of polynomials',
        ul('A quadratic with real coefficients and negative discriminant has roots p ± qi.', 'For any polynomial with **real coefficients**, if z is a root then so is z*.', 'A cubic has either three real roots, or one real root and a conjugate pair.', 'Given one complex root: write its conjugate, multiply (x − z)(x − z*) to get a real quadratic factor, then divide.'),
      ),
    ],
  ),
  topic(
    'fm-roots',
    'F1 · 2',
    'Roots of Quadratic Equations',
    'Sum and product of roots · expressions in α and β · forming new equations',
    'Sum is −b ÷ a. Product is c ÷ a.',
    ['Roots: The solutions α and β of ax^2 + bx + c = 0.', 'Symmetric expression: One unchanged when α and β are swapped, so it can be written in α + β and αβ.'],
    [
      sec(
        'Sum and product',
        f('α + β = −b ÷ a', 'αβ = c ÷ a', 'α^2 + β^2 = (α + β)^2 − 2αβ', 'α^3 + β^3 = (α + β)^3 − 3αβ(α + β)', '1 ÷ α + 1 ÷ β = (α + β) ÷ αβ'),
      ),
      sec(
        'Forming a new equation',
        ol('Write down α + β and αβ for the given equation.', 'Find the sum and the product of the **new** roots in terms of those.', 'The equation is x^2 − (sum)x + (product) = 0.', 'Multiply through to get integer coefficients if asked.'),
        tip('You never need to solve the original equation. Leave everything in terms of α + β and αβ.'),
      ),
    ],
  ),
  topic(
    'fm-numerical',
    'F1 · 3',
    'Numerical Solutions of Equations',
    'Locating roots by sign change · interval bisection · linear interpolation · Newton–Raphson',
    'A sign change in a continuous function traps a root.',
    ['Root: A value of x where f(x) = 0.', 'Continuous: With no breaks or asymptotes in the interval.', 'Iteration: Repeating a process, feeding each answer back in.'],
    [
      sec(
        'Three methods',
        tbl(
          ['Method', 'Step', 'Note'],
          ['Interval bisection', 'Evaluate f at the midpoint; keep the half with the sign change', 'Slow but certain'],
          ['Linear interpolation', 'Join the two end points with a straight line and take where it crosses the axis', 'Uses similar triangles'],
          ['Newton–Raphson', 'Follow the tangent at x_n down to the axis', 'Fast; needs f′(x)'],
        ),
        f('linear interpolation on [a, b]:  x = (a|f(b)| + b|f(a)|) ÷ (|f(a)| + |f(b)|)', 'Newton–Raphson:  x_{n+1} = x_n − f(x_n) ÷ f′(x_n)'),
        fig('newton', 'Each tangent meets the axis closer to the root than the last.'),
      ),
      sec(
        'Showing a root lies in an interval',
        'Evaluate f at both ends, state that there is a **change of sign** and that f is **continuous**, and conclude that a root lies between them.',
        trap('Newton–Raphson fails if the starting value is near a stationary point: f′(x) is close to zero, so the tangent shoots far away.'),
        tip('Work in radians for trigonometric functions and show each value of f you compute.'),
      ),
    ],
  ),
  topic(
    'fm-conics',
    'F1 · 4',
    'Coordinate Systems',
    'The parabola y² = 4ax · the rectangular hyperbola xy = c² · parametric forms · tangents and normals',
    'Every point on a parabola is as far from the focus as from the directrix.',
    ['Parabola: The locus of points equidistant from a fixed point (focus) and a fixed line (directrix).', 'Focus: For y^2 = 4ax, the point (a, 0).', 'Directrix: For y^2 = 4ax, the line x = −a.', 'Rectangular hyperbola: The curve xy = c^2, with the axes as asymptotes.'],
    [
      sec(
        'The two curves',
        tbl(['', 'Parabola', 'Rectangular hyperbola'], ['Cartesian', 'y^2 = 4ax', 'xy = c^2'], ['Parametric', '(at^2, 2at)', '(ct, c ÷ t)'], ['Gradient at t', '1 ÷ t', '−1 ÷ t^2'], ['Tangent at t', 'ty = x + at^2', 'x + t^2 y = 2ct'], ['Normal at t', 'y + tx = 2at + at^3', 't^3 x − ty = c(t^4 − 1)']),
        'These tangent and normal equations are not given: derive them each time. Differentiate (y = 2√a x^{1/2} or y = c^2 x^{−1}), substitute the parametric point, then use y − y_1 = m(x − x_1).',
      ),
      sec(
        'Typical questions',
        ul('Focus–directrix property: for a point P on the parabola, distance PS = distance from P to the directrix = x + a.', 'Where a tangent or normal meets the curve again: substitute the parametric point (as^2, 2as) into the line and solve for s.', 'Areas of triangles formed with the axes, focus or directrix: find the intercepts first.'),
        tip('Keep working in the parameter t as long as possible; the algebra stays far shorter than in x and y.'),
      ),
    ],
  ),
  topic(
    'fm-matrices',
    'F1 · 5',
    'Matrix Algebra',
    'Adding and multiplying · the identity · determinants · inverses of 2 × 2 matrices · singular matrices',
    'AB is not BA.',
    ['Identity matrix: I, with 1s on the leading diagonal and 0s elsewhere; AI = IA = A.', 'Determinant: For a 2 × 2 matrix, ad − bc.', 'Singular: A matrix with determinant 0; it has no inverse.', 'Inverse: A^{−1}, where AA^{−1} = A^{−1}A = I.'],
    [
      sec(
        'Multiplying',
        'Rows of the first into columns of the second. An m × n matrix times an n × p matrix gives m × p; the inner numbers must match.',
        code('( a  b ) ( e  f )   ( ae + bg   af + bh )\n( c  d ) ( g  h ) = ( ce + dg   cf + dh )'),
        trap('Matrix multiplication is not commutative: in general AB ≠ BA. Keep the order when rearranging.'),
      ),
      sec(
        'Determinant and inverse',
        code('A = ( a  b )      det A = ad − bc\n    ( c  d )\n\nA⁻¹ = 1 ÷ (ad − bc) × (  d  −b )\n                       ( −c   a )'),
        f('(AB)^{−1} = B^{−1} A^{−1}'),
        ul('Singular means det A = 0: set the determinant to zero to find the unknown.', 'To solve AX = B, multiply on the **left** by A^{−1}: X = A^{−1}B.', 'To solve XA = B, multiply on the right: X = BA^{−1}.'),
      ),
    ],
  ),
  topic(
    'fm-transformations',
    'F1 · 6',
    'Matrix Transformations',
    'Linear transformations · rotations, reflections and enlargements · combining · inverses · area scale factor',
    'The columns are where (1, 0) and (0, 1) land.',
    ['Linear transformation: A map of the plane that keeps the origin fixed and lines straight.', 'Invariant point: A point that maps to itself.', 'Area scale factor: |det M|, the factor by which areas are multiplied.'],
    [
      sec(
        'Standard matrices',
        code('Rotation θ anticlockwise     Enlargement, factor k\n( cos θ  −sin θ )            ( k  0 )\n( sin θ   cos θ )            ( 0  k )\n\nReflection in x-axis   in y-axis    in y = x    in y = −x\n( 1   0 )              ( −1  0 )    ( 0  1 )    (  0  −1 )\n( 0  −1 )              (  0  1 )    ( 1  0 )    ( −1   0 )'),
        'To find or recognise any matrix, see where the unit vectors (1, 0) and (0, 1) go: their images are the first and second columns.',
      ),
      sec(
        'Combining and undoing',
        ul('**BA** means do A first, then B (work right to left).', 'The inverse matrix reverses the transformation.', 'Area of image = |det M| × area of object. A negative determinant means the shape has been flipped.', 'To transform a shape, put its vertices as columns of one matrix and multiply once.'),
        fig('argand', 'A quarter-turn rotation: the same turn the matrix (0 −1 ; 1 0) gives every point.'),
        tip('Describe a transformation fully: rotation needs angle, direction and centre; reflection needs the mirror line; enlargement needs scale factor and centre.'),
      ),
    ],
  ),
  topic(
    'fm-series',
    'F1 · 7',
    'Series',
    'Sums of r, r² and r³ · using the standard results · sums that do not start at 1',
    'Split the sum, then use the standard results.',
    ['Series: The sum of the terms of a sequence.', 'Sigma notation: Σ, shorthand for "add up every term from the lower limit to the upper".'],
    [
      sec(
        'Standard results',
        f('Σ 1 = n', 'Σ r = ½n(n + 1)', 'Σ r^2 = n(n + 1)(2n + 1) ÷ 6', 'Σ r^3 = ¼n^2 (n + 1)^2'),
        'All from r = 1 to n. Σ r and Σ r^3 are linked: Σ r^3 = (Σ r)^2.',
      ),
      sec(
        'Using them',
        ol('Expand the general term into powers of r.', 'Split into separate sums and take constants outside.', 'Substitute the standard results.', 'Factorise: take out the common factors (often n(n + 1) and a fraction) **before** expanding anything.'),
        f('Σ from r = k to n  =  Σ from 1 to n  −  Σ from 1 to (k − 1)'),
        trap('Σ 3 from r = 1 to n is 3n, not 3. And the lower sum stops at k − 1, not k.'),
      ),
    ],
  ),
  topic(
    'fm-induction',
    'F1 · 8',
    'Proof by Induction',
    'The four steps · sums of series · divisibility · recurrence relations · matrix powers',
    'Show it for 1. Assume it for k. Prove it for k + 1.',
    ['Basis step: Showing the statement is true for the first value, usually n = 1.', 'Inductive hypothesis: Assuming the statement is true for n = k.', 'Inductive step: Using that assumption to prove the statement for n = k + 1.'],
    [
      sec(
        'The four steps',
        ol('**Basis:** show both sides agree for n = 1.', '**Assumption:** assume true for n = k.', '**Inductive step:** show it then holds for n = k + 1.', '**Conclusion:** "True for n = 1; if true for n = k then true for n = k + 1; so true for all positive integers n."'),
        tip('The conclusion sentence earns a mark of its own. Write it in full every time.'),
      ),
      sec(
        'The four types',
        tbl(
          ['Type', 'Key move in the inductive step'],
          ['Sum of a series', 'Sum to k + 1 = (assumed sum to k) + the (k + 1)th term; factorise towards the target'],
          ['Divisibility', 'Consider f(k + 1) − f(k), or write f(k + 1) in terms of f(k), and show the rest is a multiple'],
          ['Recurrence relation', 'Substitute the assumed formula for u_k into the recurrence; may need two basis cases if u_{n+2} depends on two terms'],
          ['Matrix power', 'M^{k+1} = M^k × M, using the assumed form of M^k'],
        ),
        trap('Aim for the target: write down what the n = k + 1 result should look like before starting the algebra.'),
      ),
    ],
  ),
];

export const FURTHER: NoteSubject = {
  id: 'further',
  name: 'Further Maths',
  study: 'Further Maths',
  board: 'Edexcel International A Level',
  hue: 280,
  units: [{ id: 'f1', code: 'WFM01', name: 'Further Pure Mathematics 1', topics: f1 }],
};
