/** Further Maths: Pearson Edexcel International A Level, A2 units F2 (WFM02) and F3 (WFM03). */
import { f, ol, sec, tbl, tip, topic, trap, ul, type NoteUnit } from '../types';

const f2 = [
  topic(
    'fm-f2-inequalities',
    'F2 · 1',
    'Inequalities',
    'Algebraic fractions · critical values · inequalities with a modulus · solving from a sketch',
    'Never multiply by something whose sign you do not know.',
    ['Critical value: A value of x where the two sides are equal or where an expression is undefined.', 'Modulus: |x|, the size of x without its sign.', 'Asymptote: A line a curve approaches but never reaches; here, where a denominator is zero.'],
    [
      sec(
        'Algebraic method',
        ol('Bring everything to one side, or multiply both sides by the **square** of each denominator (a square is never negative, so the sign keeps its direction).', 'Factorise; do not expand what is already a common factor.', 'Find the critical values: the roots, and the values that make a denominator zero.', 'Test a value in each region, or sketch the polynomial, and write down the regions that work.'),
        trap('Multiplying both sides by (x − 2) is wrong, because (x − 2) may be negative. Multiply by (x − 2)^2 instead.'),
        tip('Values that make a denominator zero are never included, even when the inequality is ≤ or ≥.'),
      ),
      sec(
        'Modulus and graphs',
        ul('Sketch both sides on the same axes. Reflect the part of y = f(x) below the x-axis to get y = |f(x)|.', 'Find the intersections by solving f(x) = g(x) and −f(x) = g(x); check each on the sketch, because some are not real intersections.', 'Read off where one graph is above the other.'),
        f('|f(x)| < a  ⟺  −a < f(x) < a', '|f(x)| > a  ⟺  f(x) < −a  or  f(x) > a'),
      ),
    ],
  ),
  topic(
    'fm-f2-series',
    'F2 · 2',
    'Series',
    'The method of differences · partial fractions in sums · sums to infinity',
    'Write out the terms and watch them cancel.',
    ['Method of differences: Writing each term as f(r) − f(r + 1) so that a sum collapses to a few terms.', 'Telescoping: The cancelling of middle terms in such a sum.', 'Partial fractions: Splitting one fraction into a sum of simpler ones.'],
    [
      sec(
        'The method of differences',
        f('if u_r = f(r) − f(r + 1)  then  Σ_{r=1}^{n} u_r = f(1) − f(n + 1)'),
        ol('Split the general term, usually with partial fractions.', 'Write out the first three and the last two or three terms in columns.', 'Cancel along the diagonals and collect what is left.', 'Simplify to a single fraction if the question gives the form.'),
        trap('When the difference is f(r) − f(r + 2), **two** terms survive at each end, not one.'),
      ),
      sec(
        'Using the result',
        ul('A sum from r = k to n is (sum from 1 to n) − (sum from 1 to k − 1).', 'The sum to infinity is the limit as n → ∞: terms like 1 ÷ (n + 1) go to zero.', 'A sum to 2n is found by replacing n with 2n in the formula.'),
        tip('Check your formula with n = 1: it must give the first term.'),
      ),
    ],
  ),
  topic(
    'fm-f2-complex',
    'F2 · 3',
    'Further Complex Numbers',
    'Exponential form · de Moivre’s theorem · trigonometric identities · nth roots · loci and regions · transformations of the plane',
    'Multiply moduli, add arguments.',
    ['Exponential form: z = re^{iθ}, where r is the modulus and θ the argument.', 'De Moivre’s theorem: (cos θ + i sin θ)^n = cos nθ + i sin nθ.', 'Roots of unity: The n solutions of z^n = 1, equally spaced round the unit circle.', 'Locus: The set of points z that satisfy a condition.'],
    [
      sec(
        'Exponential form and de Moivre',
        f('e^{iθ} = cos θ + i sin θ', 'z^n = r^n (cos nθ + i sin nθ)', 'z + 1 ÷ z = 2 cos θ,   z − 1 ÷ z = 2i sin θ   (|z| = 1)', 'z^n + 1 ÷ z^n = 2 cos nθ,   z^n − 1 ÷ z^n = 2i sin nθ'),
        ul('**cos nθ in powers of cos θ:** expand (cos θ + i sin θ)^n with the binomial and compare real parts.', '**cos^n θ in multiple angles:** expand (z + 1 ÷ z)^n and pair the terms.'),
      ),
      sec(
        'nth roots',
        ol('Write the number as r e^{i(θ + 2kπ)}.', 'Take the nth root: r^{1/n} e^{i(θ + 2kπ)/n}.', 'Use k = 0, 1, …, n − 1 (or the values that keep the argument in range).'),
        'The n roots lie on a circle of radius r^{1/n}, spaced 2π ÷ n apart, so they form a regular polygon.',
      ),
      sec(
        'Loci and transformations',
        tbl(
          ['Condition', 'Locus'],
          ['|z − a| = r', 'Circle, centre a, radius r'],
          ['|z − a| = |z − b|', 'Perpendicular bisector of the line joining a and b'],
          ['arg(z − a) = θ', 'Half-line from a (not including a) at angle θ'],
          ['|z − a| = k|z − b|, k ≠ 1', 'A circle; put z = x + iy and square'],
          ['arg((z − a) ÷ (z − b)) = θ', 'An arc of a circle through a and b'],
        ),
        'For a transformation w = f(z) from the z-plane to the w-plane: make z the subject, then substitute into the condition on z.',
        trap('A half-line starts at an open circle: arg is not defined at the point itself.'),
      ),
    ],
  ),
  topic(
    'fm-f2-first-order',
    'F2 · 4',
    'First Order Differential Equations',
    'Separating variables · the integrating factor · substitutions · families of solution curves',
    'Multiply by e to the integral of P.',
    ['Order: The highest derivative that appears.', 'General solution: The solution with its arbitrary constant.', 'Particular solution: The one that fits given conditions.', 'Integrating factor: e^{∫P dx}, which turns the left side into an exact derivative.'],
    [
      sec(
        'Integrating factor',
        f('dy/dx + P(x) y = Q(x)', 'I = e^{∫P dx}', 'I y = ∫ I Q dx + c'),
        ol('Divide through so the coefficient of dy/dx is 1.', 'Find the integrating factor and simplify it (e^{ln f} = f).', 'Write d/dx (I y) = I Q and integrate.', 'Divide by I, remembering to divide the constant too.'),
        trap('Leaving out the "+ c" until after dividing by the integrating factor loses the c ÷ I term.'),
      ),
      sec(
        'Substitutions',
        'A given substitution turns an awkward equation into one that separates or is linear. Differentiate the substitution (with the product or chain rule) to replace dy/dx, substitute, solve in the new variable, then change back.',
        tip('For y = vx: dy/dx = v + x dv/dx. For z = y^{−1}: dz/dx = −y^{−2} dy/dx.'),
      ),
    ],
  ),
  topic(
    'fm-f2-second-order',
    'F2 · 5',
    'Second Order Differential Equations',
    'The auxiliary equation · complementary function · particular integral · boundary conditions · substitutions',
    'General solution = complementary function + particular integral.',
    ['Auxiliary equation: am^2 + bm + c = 0, from trying y = e^{mx}.', 'Complementary function: The general solution of the equation with zero on the right.', 'Particular integral: Any one solution of the full equation.'],
    [
      sec(
        'Complementary function',
        tbl(
          ['Roots of the auxiliary equation', 'Complementary function'],
          ['Real and different, α and β', 'y = Ae^{αx} + Be^{βx}'],
          ['Repeated, α', 'y = (A + Bx)e^{αx}'],
          ['Pure imaginary, ±iω', 'y = A cos ωx + B sin ωx'],
          ['Complex, p ± iq', 'y = e^{px}(A cos qx + B sin qx)'],
        ),
      ),
      sec(
        'Particular integral',
        tbl(['Right-hand side', 'Try'], ['k', 'λ'], ['Polynomial of degree n', 'A polynomial of degree n with every term'], ['ke^{px}', 'λe^{px}'], ['k cos ωx or k sin ωx', 'λ cos ωx + μ sin ωx']),
        ul('Differentiate the trial function twice, substitute and compare coefficients.', 'If the trial function is already part of the complementary function, multiply it by x.', 'Apply boundary conditions to the **full** general solution, after adding the particular integral.'),
        trap('Finding A and B from the complementary function alone, before adding the particular integral, gives the wrong constants.'),
      ),
    ],
  ),
  topic(
    'fm-f2-maclaurin',
    'F2 · 6',
    'Maclaurin and Taylor Series',
    'Higher derivatives · Maclaurin series · standard results · Taylor series about a point · series solutions of differential equations',
    'A function is its derivatives at one point.',
    ['Maclaurin series: The expansion of f(x) in powers of x, from the derivatives at 0.', 'Taylor series: The expansion in powers of (x − a), from the derivatives at a.', 'Valid: The values of x for which the series converges to the function.'],
    [
      sec(
        'The series',
        f('f(x) = f(0) + f′(0)x + f″(0)x^2 ÷ 2! + f‴(0)x^3 ÷ 3! + …', 'f(x) = f(a) + f′(a)(x − a) + f″(a)(x − a)^2 ÷ 2! + …', 'e^x = 1 + x + x^2 ÷ 2! + x^3 ÷ 3! + …', 'sin x = x − x^3 ÷ 3! + x^5 ÷ 5! − …', 'cos x = 1 − x^2 ÷ 2! + x^4 ÷ 4! − …', 'ln(1 + x) = x − x^2 ÷ 2 + x^3 ÷ 3 − …   (−1 < x ≤ 1)'),
        tip('For a composite such as e^{x} cos x or ln(1 + sin x), substitute or multiply the standard series instead of differentiating many times.'),
      ),
      sec(
        'Series solutions of differential equations',
        ol('Use the initial conditions for y and dy/dx at the given point.', 'Put them into the equation to find the second derivative there.', 'Differentiate the equation implicitly to get the third derivative, and so on.', 'Substitute the values into the Taylor series.'),
        trap('Differentiating a product such as x (dy/dx) needs the product rule: it gives dy/dx + x d^2y/dx^2.'),
      ),
    ],
  ),
  topic(
    'fm-f2-polar',
    'F2 · 7',
    'Polar Coordinates',
    'Polar and Cartesian forms · sketching polar curves · area of a sector · tangents parallel and perpendicular to the initial line',
    'Area is half r squared dθ.',
    ['Pole: The origin of polar coordinates.', 'Initial line: The half-line θ = 0, along the positive x-axis.', 'Polar coordinates: (r, θ), the distance from the pole and the angle from the initial line.'],
    [
      sec(
        'Converting and sketching',
        f('x = r cos θ,   y = r sin θ', 'r^2 = x^2 + y^2,   tan θ = y ÷ x'),
        tbl(['Equation', 'Curve'], ['r = a', 'Circle, centre the pole'], ['θ = α', 'Half-line from the pole'], ['r = aθ', 'Spiral'], ['r = a(1 + cos θ)', 'Cardioid'], ['r = a cos nθ', 'Rose with n loops (n odd) or 2n (n even)'], ['r^2 = a^2 cos 2θ', 'Lemniscate']),
        'To sketch, tabulate r for θ = 0, π/6, π/4, … and note where r = 0 and where r is largest. Edexcel takes r ≥ 0, so a curve exists only where the formula is not negative.',
      ),
      sec(
        'Area and tangents',
        f('Area = ½ ∫ r^2 dθ   (from α to β)', 'parallel to the initial line:  d(r sin θ)/dθ = 0', 'perpendicular to the initial line:  d(r cos θ)/dθ = 0'),
        ul('For the area between two curves, find where they meet, then add or subtract sectors: sketch first.', 'Use cos^2 θ = ½(1 + cos 2θ) and sin^2 θ = ½(1 − cos 2θ) to integrate r^2.'),
        tip('Use symmetry: find the area of half a loop and double it. It halves the chance of a limits error.'),
      ),
    ],
  ),
];

const f3 = [
  topic(
    'fm-f3-hyperbolic',
    'F3 · 1',
    'Hyperbolic Functions',
    'Definitions of sinh, cosh and tanh · graphs · identities and Osborn’s rule · inverse functions as logarithms · equations',
    'Trig identities with one sign changed.',
    ['sinh x: (e^x − e^{−x}) ÷ 2, an odd function through the origin.', 'cosh x: (e^x + e^{−x}) ÷ 2, an even function with minimum 1 at x = 0.', 'tanh x: sinh x ÷ cosh x, which lies between −1 and 1.', 'Osborn’s rule: A trig identity becomes hyperbolic by changing the sign of any product of two sines.'],
    [
      sec(
        'Definitions and identities',
        f('cosh^2 x − sinh^2 x = 1', 'sinh 2x = 2 sinh x cosh x', 'cosh 2x = cosh^2 x + sinh^2 x = 2cosh^2 x − 1 = 1 + 2sinh^2 x', '1 − tanh^2 x = sech^2 x'),
        'To prove an identity, replace each function by its exponential definition and simplify.',
      ),
      sec(
        'Inverses and equations',
        f('arsinh x = ln(x + √(x^2 + 1))', 'arcosh x = ln(x + √(x^2 − 1)),   x ≥ 1', 'artanh x = ½ ln((1 + x) ÷ (1 − x)),   |x| < 1'),
        ul('An equation in one function: use an identity to get a quadratic, then the log form of the inverse.', 'An equation mixing sinh and cosh: write in exponentials, multiply by e^x and solve the quadratic in e^x.', 'cosh x = k has **two** solutions, ±arcosh k.'),
        trap('e^x is never negative, so reject a negative root of the quadratic in e^x.'),
      ),
    ],
  ),
  topic(
    'fm-f3-conics',
    'F3 · 2',
    'Further Coordinate Systems',
    'The ellipse and the hyperbola · parametric forms · eccentricity, foci and directrices · tangents and normals · loci',
    'Eccentricity under 1 is an ellipse, over 1 a hyperbola.',
    ['Eccentricity: e, the constant ratio of the distance to the focus and the distance to the directrix.', 'Focus: A fixed point used to define a conic.', 'Directrix: A fixed line used to define a conic.', 'Asymptotes: For a hyperbola, the lines y = ±(b ÷ a)x.'],
    [
      sec(
        'The two curves',
        tbl(
          ['', 'Ellipse', 'Hyperbola'],
          ['Equation', 'x^2 ÷ a^2 + y^2 ÷ b^2 = 1', 'x^2 ÷ a^2 − y^2 ÷ b^2 = 1'],
          ['Parametric', '(a cos θ, b sin θ)', '(a sec θ, b tan θ) or (a cosh t, b sinh t)'],
          ['Eccentricity', 'b^2 = a^2(1 − e^2), e < 1', 'b^2 = a^2(e^2 − 1), e > 1'],
          ['Foci', '(±ae, 0)', '(±ae, 0)'],
          ['Directrices', 'x = ±a ÷ e', 'x = ±a ÷ e'],
        ),
        'For an ellipse the sum of the distances from any point to the two foci is 2a.',
      ),
      sec(
        'Tangents, normals and loci',
        ol('Differentiate implicitly or parametrically to find dy/dx at the general point.', 'Write the tangent or normal through that point and simplify with cos^2 + sin^2 = 1 or sec^2 − tan^2 = 1.', 'For a locus: find the coordinates of the moving point in terms of the parameter, then eliminate the parameter.'),
        tip('The formula booklet gives the standard forms. Quote the parametric point, then differentiate: marks are for the working, not the memory.'),
      ),
    ],
  ),
  topic(
    'fm-f3-differentiation',
    'F3 · 3',
    'Differentiation',
    'Derivatives of hyperbolic functions · inverse trigonometric functions · inverse hyperbolic functions',
    'Differentiate the inverse by differentiating its definition.',
    ['Inverse function: arcsin x is the angle whose sine is x; likewise arsinh x.', 'Implicit differentiation: Differentiating both sides with respect to x, with dy/dx attached to terms in y.'],
    [
      sec(
        'Results',
        tbl(
          ['y', 'dy/dx'],
          ['sinh x', 'cosh x'],
          ['cosh x', 'sinh x'],
          ['tanh x', 'sech^2 x'],
          ['arcsin x', '1 ÷ √(1 − x^2)'],
          ['arccos x', '−1 ÷ √(1 − x^2)'],
          ['arctan x', '1 ÷ (1 + x^2)'],
          ['arsinh x', '1 ÷ √(x^2 + 1)'],
          ['arcosh x', '1 ÷ √(x^2 − 1)'],
          ['artanh x', '1 ÷ (1 − x^2)'],
        ),
        trap('The derivative of cosh x is **plus** sinh x. There is no minus sign as there is for cos x.'),
      ),
      sec(
        'Deriving a result',
        ol('Write y = arsinh x as sinh y = x.', 'Differentiate: cosh y dy/dx = 1.', 'Replace cosh y using cosh^2 y = 1 + sinh^2 y = 1 + x^2.', 'So dy/dx = 1 ÷ √(1 + x^2).'),
        'With a function inside, use the chain rule: d/dx arctan(3x) = 3 ÷ (1 + 9x^2).',
      ),
    ],
  ),
  topic(
    'fm-f3-integration',
    'F3 · 4',
    'Integration',
    'Standard integrals giving inverse functions · trigonometric and hyperbolic substitutions · reduction formulae · arc length · area of a surface of revolution',
    'The shape under the root picks the substitution.',
    ['Reduction formula: A relation giving an integral I_n in terms of I_{n−1} or I_{n−2}.', 'Arc length: The distance along a curve between two points.', 'Surface of revolution: The surface swept out when a curve turns about an axis.'],
    [
      sec(
        'Standard forms and substitutions',
        tbl(
          ['Integrand', 'Integral', 'Substitution'],
          ['1 ÷ √(a^2 − x^2)', 'arcsin(x ÷ a)', 'x = a sin θ'],
          ['1 ÷ (a^2 + x^2)', '(1 ÷ a) arctan(x ÷ a)', 'x = a tan θ'],
          ['1 ÷ √(x^2 + a^2)', 'arsinh(x ÷ a)', 'x = a sinh u'],
          ['1 ÷ √(x^2 − a^2)', 'arcosh(x ÷ a)', 'x = a cosh u'],
        ),
        'A quadratic under the root that is not in one of these forms: complete the square first.',
      ),
      sec(
        'Reduction formulae',
        ol('Integrate by parts once, choosing the part whose power drops.', 'Rewrite what is left in terms of I_{n−1} or I_{n−2}, often with an identity such as sin^2 = 1 − cos^2.', 'Rearrange for I_n.', 'Find I_0 or I_1 directly, then step up to the one asked for.'),
      ),
      sec(
        'Arc length and surface area',
        f('s = ∫ √(1 + (dy/dx)^2) dx', 's = ∫ √((dx/dt)^2 + (dy/dt)^2) dt', 'S = 2π ∫ y √(1 + (dy/dx)^2) dx   (about the x-axis)'),
        tip('Simplify 1 + (dy/dx)^2 before taking the root: in exam questions it is nearly always a perfect square.'),
      ),
    ],
  ),
  topic(
    'fm-f3-vectors',
    'F3 · 5',
    'Vectors',
    'The vector product · areas and volumes · equations of lines and planes · intersections · angles and distances',
    'The cross product is perpendicular to both.',
    ['Vector product: a × b, a vector of size |a||b| sin θ perpendicular to a and b.', 'Scalar triple product: a · (b × c), the volume of the parallelepiped with those edges.', 'Normal: A vector perpendicular to a plane.'],
    [
      sec(
        'Products, areas and volumes',
        f('a × b = (a_2 b_3 − a_3 b_2) i − (a_1 b_3 − a_3 b_1) j + (a_1 b_2 − a_2 b_1) k', 'area of triangle = ½ |a × b|', 'volume of parallelepiped = |a · (b × c)|', 'volume of tetrahedron = ⅙ |a · (b × c)|'),
        trap('a × b = −(b × a). The order matters, unlike the scalar product.'),
      ),
      sec(
        'Lines and planes',
        tbl(
          ['Object', 'Equation'],
          ['Line, vector form', 'r = a + λb'],
          ['Line, product form', '(r − a) × b = 0'],
          ['Line, Cartesian', '(x − a_1) ÷ b_1 = (y − a_2) ÷ b_2 = (z − a_3) ÷ b_3'],
          ['Plane, scalar product', 'r · n = a · n'],
          ['Plane, Cartesian', 'n_1 x + n_2 y + n_3 z = d'],
          ['Plane, parametric', 'r = a + λb + μc'],
        ),
        'The normal to a plane through three points is the vector product of two vectors lying in it.',
      ),
      sec(
        'Angles, distances and intersections',
        ul('**Line and plane:** sin θ = |b · n| ÷ (|b||n|). **Two planes:** cos θ = |n_1 · n_2| ÷ (|n_1||n_2|).', '**Point to plane:** |n_1 α + n_2 β + n_3 γ − d| ÷ |n|.', '**Line meets plane:** substitute the general point of the line into the plane’s equation and solve for λ.', '**Two planes:** the line of intersection has direction n_1 × n_2; find one common point by setting a coordinate to zero.', '**Skew lines:** the shortest distance is |(a − c) · (b × d)| ÷ |b × d|.'),
      ),
    ],
  ),
  topic(
    'fm-f3-matrices',
    'F3 · 6',
    'Further Matrix Algebra',
    '3 × 3 determinants and inverses · transpose · linear transformations in three dimensions · eigenvalues and eigenvectors · diagonalising symmetric matrices',
    'An eigenvector keeps its direction.',
    ['Transpose: M^T, the matrix with rows and columns swapped.', 'Eigenvector: A non-zero vector x with Mx = λx.', 'Eigenvalue: The scale factor λ that goes with an eigenvector.', 'Characteristic equation: det(M − λI) = 0.', 'Orthogonal matrix: One whose columns are perpendicular unit vectors, so P^{−1} = P^T.'],
    [
      sec(
        'Determinant and inverse of a 3 × 3 matrix',
        ol('Find the matrix of minors.', 'Apply the alternating signs + − + to get the cofactors.', 'Transpose.', 'Divide by the determinant.'),
        f('det M = a(ei − fh) − b(di − fg) + c(dh − eg)', '(AB)^{−1} = B^{−1}A^{−1},   (AB)^T = B^T A^T'),
        'A matrix with determinant zero is singular: it has no inverse, and as a transformation it flattens space onto a plane or a line. The determinant is the volume scale factor.',
      ),
      sec(
        'Eigenvalues and eigenvectors',
        ol('Solve det(M − λI) = 0 for the eigenvalues.', 'For each λ, solve (M − λI)x = 0; the equations are dependent, so choose one component and find the others.', 'Normalise by dividing by the length when a unit eigenvector is asked for.'),
        tip('Check: multiply M by your eigenvector. The result must be λ times it.'),
      ),
      sec(
        'Diagonalising a symmetric matrix',
        f('P^T M P = D'),
        'For a symmetric matrix the eigenvectors of different eigenvalues are perpendicular. P has the **normalised** eigenvectors as its columns, and D has the eigenvalues on its diagonal in the same order.',
        trap('The order of the eigenvalues in D must match the order of the eigenvectors in P.'),
      ),
    ],
  ),
];

export const FURTHER_A2: NoteUnit[] = [
  { id: 'f2', code: 'WFM02', name: 'Further Pure Mathematics 2', a2: true, topics: f2 },
  { id: 'f3', code: 'WFM03', name: 'Further Pure Mathematics 3', a2: true, topics: f3 },
];
