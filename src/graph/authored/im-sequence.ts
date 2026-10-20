/**
 * The IM Math 1 to 3 integrated sequence: units in order, the CCSS standards each unit cites,
 * and lesson titles. Standards use the Learning Commons statement codes (HSA-REI.C.6).
 * Authored from the IM course outlines; the standards and progression edges themselves come
 * from the Learning Commons export when it loaded (see src/graph/data/lc-math.json).
 */
export interface ImUnitDef {
  title: string
  standards: string[]
  lessons: string[]
}
export interface ImCourseDef {
  id: string
  title: string
  units: ImUnitDef[]
}

export const IM_COURSES: ImCourseDef[] = [
  {
    id: 'crs_im1',
    title: 'IM Math 1',
    units: [
      {
        title: 'One-variable statistics',
        standards: ['HSS-ID.A.1', 'HSS-ID.A.2', 'HSS-ID.A.3', 'HSS-ID.A.4', 'HSN-Q.A.1'],
        lessons: ['Getting to know you', 'Data representations', 'A gallery of data', 'The shape of distributions', 'Calculating measures of center', 'Mean absolute deviation and standard deviation', 'Outliers and the five-number summary', 'Comparing and contrasting data distributions', 'Technology for statistics', 'Analyzing a data set'],
      },
      {
        title: 'Linear equations, inequalities, and systems',
        standards: ['HSA-CED.A.1', 'HSA-CED.A.2', 'HSA-CED.A.3', 'HSA-CED.A.4', 'HSA-REI.A.1', 'HSA-REI.B.3', 'HSA-REI.C.5', 'HSA-REI.C.6', 'HSA-REI.D.10', 'HSA-REI.D.12', 'HSA-SSE.A.1'],
        lessons: ['Planning a pizza party', 'Writing equations to model relationships', 'Equations and their solutions', 'Equations and their graphs', 'Equivalent equations', 'Connecting equations to graphs', 'Writing and graphing systems of linear equations', 'Solving systems by substitution', 'Solving systems by elimination', 'Systems of linear inequalities in two variables', 'Modeling with systems of inequalities', 'Solutions to inequalities in one variable'],
      },
      {
        title: 'Two-variable statistics',
        standards: ['HSS-ID.B.5', 'HSS-ID.B.6', 'HSS-ID.B.6.a', 'HSS-ID.C.7', 'HSS-ID.C.8', 'HSS-ID.C.9'],
        lessons: ['Two-way tables', 'Relative frequency tables', 'Associations in categorical data', 'Linear models', 'Fitting lines', 'Residuals', 'The correlation coefficient', 'Using the correlation coefficient', 'Causal relationships', 'Fossil fuels and lung cancer'],
      },
      {
        title: 'Functions',
        standards: ['HSF-IF.A.1', 'HSF-IF.A.2', 'HSF-IF.B.4', 'HSF-IF.B.5', 'HSF-IF.B.6', 'HSF-IF.C.7', 'HSF-IF.C.9', 'HSF-BF.A.1', 'HSF-BF.B.4'],
        lessons: ['Describing and graphing situations', 'Function notation', 'Interpreting and using function notation', 'Using function notation to describe rules', 'Features of graphs', 'Using graphs to find average rate of change', 'Interpreting and creating graphs', 'Domain and range', 'Piecewise functions', 'Inverse functions', 'Finding and interpreting inverse functions', 'Writing inverse functions to solve problems'],
      },
      {
        title: 'Introduction to exponential functions',
        standards: ['HSF-LE.A.1', 'HSF-LE.A.1.a', 'HSF-LE.A.1.c', 'HSF-LE.A.2', 'HSF-LE.A.3', 'HSF-LE.B.5', 'HSF-IF.C.8.b', 'HSA-SSE.B.3.c'],
        lessons: ['Growing and growing', 'Patterns of growth', 'Representing exponential growth', 'Understanding decay', 'Representing exponential decay', 'Analyzing graphs', 'Using negative exponents', 'Exponential situations as functions', 'Interpreting exponential functions', 'Looking at rates of change', 'Which one changes faster?', 'Changes over equal intervals'],
      },
      {
        title: 'Constructions and rigid transformations',
        standards: ['HSG-CO.A.1', 'HSG-CO.A.2', 'HSG-CO.A.3', 'HSG-CO.A.4', 'HSG-CO.A.5', 'HSG-CO.D.12', 'HSG-CO.D.13'],
        lessons: ['Build it', 'Constructing patterns', 'Construction techniques: perpendicular bisectors', 'Construction techniques: perpendicular lines and angle bisectors', 'Symmetry', 'Defining transformations', 'Reflections', 'Rotations', 'Translations', 'Rigid transformations', 'Evidence and proof'],
      },
      {
        title: 'Congruence',
        standards: ['HSG-CO.B.6', 'HSG-CO.B.7', 'HSG-CO.B.8', 'HSG-CO.C.9', 'HSG-CO.C.10', 'HSG-CO.C.11'],
        lessons: ['Congruent parts, part 1', 'Congruent parts, part 2', 'Congruent triangles, part 1', 'Congruent triangles, part 2', 'Points, segments, and zigzags', 'Side-side-angle', 'Angle-side-angle', 'Proofs about parallelograms', 'Bisect it', 'Lines and angles proofs'],
      },
    ],
  },
  {
    id: 'crs_im2',
    title: 'IM Math 2',
    units: [
      {
        title: 'Introduction to quadratic functions',
        standards: ['HSF-IF.B.4', 'HSF-IF.C.7.a', 'HSF-IF.C.8.a', 'HSF-BF.A.1.a', 'HSF-LE.A.3', 'HSA-SSE.A.1.a', 'HSA-SSE.B.3.a'],
        lessons: ['A different kind of change', 'How does it change?', 'Building quadratic functions from geometric patterns', 'Comparing quadratic and exponential functions', 'Building quadratic functions to describe situations', 'Graphs of functions in standard and factored forms', 'Graphing from the factored form', 'Vertex form', 'Graphing from the vertex form', 'Changing parameters', 'Seeing effects in a mathematical model'],
      },
      {
        title: 'Quadratic equations',
        standards: ['HSA-REI.B.4', 'HSA-REI.B.4.a', 'HSA-REI.B.4.b', 'HSA-SSE.A.2', 'HSA-SSE.B.3.b', 'HSA-REI.D.11', 'HSA-CED.A.1', 'HSN-RN.B.3'],
        lessons: ['Finding unknown inputs', 'When and why do we write quadratic equations?', 'Solving quadratic equations by reasoning', 'Solving quadratic equations with the zero product property', 'Rewriting quadratic expressions in factored form', 'Rewriting with special structures', 'Completing the square', 'Quadratic equations with irrational solutions', 'Rational and irrational solutions', 'The quadratic formula', 'Applying the quadratic formula', 'Vertex form revisited'],
      },
      {
        title: 'Similarity',
        standards: ['HSG-SRT.A.1', 'HSG-SRT.A.1.a', 'HSG-SRT.A.1.b', 'HSG-SRT.A.2', 'HSG-SRT.A.3', 'HSG-SRT.B.4', 'HSG-SRT.B.5', 'HSG-CO.A.2'],
        lessons: ['Scale drawings', 'Scale of the solar system', 'Measuring dilations', 'Dilating lines and angles', 'Splitting triangle sides with dilation', 'Connecting similarity and transformations', 'The angle-angle triangle similarity theorem', 'Similar triangles and proportions', 'Proving the Pythagorean theorem', 'Practice with proportional relationships'],
      },
      {
        title: 'Right triangle trigonometry',
        standards: ['HSG-SRT.C.6', 'HSG-SRT.C.7', 'HSG-SRT.C.8', 'HSG-SRT.D.9', 'HSG-SRT.D.10', 'HSG-SRT.D.11'],
        lessons: ['Angles and steepness', 'Half a square', 'Half an equilateral triangle', 'Ratios in right triangles', 'Working with ratios in right triangles', 'Working with trigonometric ratios', 'Applying ratios in right triangles', 'Sine and cosine in the same triangle', 'Using trigonometric ratios to find angles', 'Solving problems with trigonometry', 'Using the law of sines and cosines'],
      },
      {
        title: 'Solid geometry',
        standards: ['HSG-GMD.A.1', 'HSG-GMD.A.3', 'HSG-GMD.B.4', 'HSG-MG.A.1', 'HSG-MG.A.2', 'HSG-MG.A.3'],
        lessons: ['Solids of rotation', 'Slicing solids', 'Creating cross sections by dilating', 'Scaling and area', 'Scaling and unscaling', 'Scaling solids', 'The volume of a prism', 'Cavalieri’s principle', 'The volume of a pyramid and a cone', 'Volume and surface area', 'Working with density'],
      },
      {
        title: 'Coordinate geometry',
        standards: ['HSG-GPE.A.1', 'HSG-GPE.A.2', 'HSG-GPE.B.4', 'HSG-GPE.B.5', 'HSG-GPE.B.6', 'HSG-GPE.B.7', 'HSG-CO.A.5'],
        lessons: ['Rigid transformations in the plane', 'Transformations as functions', 'Types of transformations', 'Distances and circles', 'Squares and circles', 'Completing the square to find a circle', 'Distances and parabolas', 'Equations and graphs', 'Equations of lines', 'Parallel lines in the plane', 'Perpendicular lines', 'Weighted averages and midpoints'],
      },
      {
        title: 'Circles',
        standards: ['HSG-C.A.1', 'HSG-C.A.2', 'HSG-C.A.3', 'HSG-C.B.5', 'HSG-CO.D.13'],
        lessons: ['Lines, angles, and curves', 'Inscribed angles', 'Tangent lines', 'Quadrilaterals in circles', 'Triangles in circles', 'A special point', 'Circles in triangles', 'Arcs and sectors', 'Part to whole', 'Angles, arcs, and radii', 'A new way to measure angles'],
      },
      {
        title: 'Conditional probability',
        standards: ['HSS-CP.A.1', 'HSS-CP.A.2', 'HSS-CP.A.3', 'HSS-CP.A.4', 'HSS-CP.A.5', 'HSS-CP.B.6', 'HSS-CP.B.7'],
        lessons: ['Up to chance', 'Playing with probability', 'Sample spaces', 'Tables of relative frequencies', 'Combining events', 'The addition rule', 'Related events', 'Conditional probability', 'Using tables for conditional probability', 'Using probability to determine whether events are independent', 'Probabilities in games'],
      },
    ],
  },
  {
    id: 'crs_im3',
    title: 'IM Math 3',
    units: [
      {
        title: 'Sequences and functions',
        standards: ['HSF-IF.A.3', 'HSF-BF.A.2', 'HSF-LE.A.2', 'HSF-BF.A.1.a', 'HSF-IF.B.6'],
        lessons: ['A towering sequence', 'Introducing geometric sequences', 'Different types of sequences', 'Using technology to work with sequences', 'Sequences are functions', 'Representing sequences', 'Representing more sequences', 'The nth term', 'What’s the equation?', 'Situations and sequence types', 'Adding up'],
      },
      {
        title: 'Polynomials and rational functions',
        standards: ['HSA-APR.A.1', 'HSA-APR.B.2', 'HSA-APR.B.3', 'HSA-APR.C.4', 'HSA-APR.D.6', 'HSA-REI.A.2', 'HSF-IF.C.7.c', 'HSF-IF.C.7.d'],
        lessons: ['Let’s make a box', 'Funding the future', 'Introducing polynomials', 'Combining polynomials', 'Connecting factors and zeros', 'Different forms', 'Using factors and zeros', 'End behavior', 'Multiplicity', 'Polynomial division', 'The remainder theorem', 'Rational functions and asymptotes', 'Solving rational equations'],
      },
      {
        title: 'Complex numbers and rational exponents',
        standards: ['HSN-RN.A.1', 'HSN-RN.A.2', 'HSN-CN.A.1', 'HSN-CN.A.2', 'HSN-CN.C.7', 'HSA-REI.B.4.b', 'HSA-SSE.B.3.c'],
        lessons: ['Properties of exponents', 'Square roots and cube roots', 'Exponents that are unit fractions', 'Exponents that are fractions', 'Solving equations with square roots', 'Solving equations with cube roots', 'Introducing imaginary numbers', 'Arithmetic with complex numbers', 'Multiplying complex numbers', 'Solving quadratics with complex solutions'],
      },
      {
        title: 'Exponential functions and equations',
        standards: ['HSF-LE.A.4', 'HSF-LE.B.5', 'HSF-IF.C.8.b', 'HSF-BF.B.5', 'HSA-SSE.B.4', 'HSF-IF.C.7.e'],
        lessons: ['Growing and shrinking', 'Representations of growth and decay', 'Understanding rational inputs', 'Representing functions at rational inputs', 'Changes over rational intervals', 'Writing equations for exponential functions', 'Interpreting and using exponential functions', 'Unknown exponents', 'What is a logarithm?', 'Interpreting exponential functions with logarithms', 'Evaluating logarithmic expressions', 'The number e', 'Logarithmic functions'],
      },
      {
        title: 'Transformations of functions',
        standards: ['HSF-BF.B.3', 'HSF-BF.B.4.a', 'HSF-IF.C.7', 'HSF-IF.C.9', 'HSF-BF.A.1.b'],
        lessons: ['Matching up to data', 'Moving functions', 'More movement', 'Reflecting functions', 'Some functions have symmetry', 'Symmetry in equations', 'Expressing transformations of functions algebraically', 'Scaling the outputs', 'Scaling the inputs', 'Combining functions', 'Making a model for data'],
      },
      {
        title: 'Trigonometric functions',
        standards: ['HSF-TF.A.1', 'HSF-TF.A.2', 'HSF-TF.B.5', 'HSF-TF.C.8', 'HSF-IF.C.7.e', 'HSF-BF.B.3'],
        lessons: ['Moving in circles', 'Revisiting right triangles', 'The unit circle, part 1', 'The unit circle, part 2', 'The Pythagorean identity', 'Beyond pi over 2', 'The tangent function', 'Graphing sine and cosine', 'Transforming trigonometric functions', 'Modeling circular motion', 'Modeling with periodic functions'],
      },
      {
        title: 'Statistical inferences',
        standards: ['HSS-IC.A.1', 'HSS-IC.A.2', 'HSS-IC.B.3', 'HSS-IC.B.4', 'HSS-IC.B.5', 'HSS-IC.B.6', 'HSS-ID.A.4'],
        lessons: ['Being skeptical', 'Study types', 'Randomness in groups', 'Using normal distributions', 'Areas under a normal curve', 'Estimating a population proportion', 'Variability in sample means', 'Interpreting a margin of error', 'Estimating treatment effects', 'Using simulation to decide', 'Heads up: inferences from experiments'],
      },
    ],
  },
]

/** Every standard code the three courses cite, in sequence order (first use). */
export function imStandardCodes(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of IM_COURSES) for (const u of c.units) for (const s of u.standards) if (!seen.has(s)) { seen.add(s); out.push(s) }
  return out
}
