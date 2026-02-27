import { parse } from 'java-parser';

/**
 * Analyzes Java code to estimate time and space complexity
 * Uses both AST traversal and pattern matching for robustness
 */
export class ComplexityAnalyzer {
  constructor(code) {
    this.code = code;
    this.ast = null;
    this.loopDepth = 0;
    this.maxLoopDepth = 0;
    this.hasRecursion = false;
    this.recursionType = null;
    this.arrayAllocations = [];
    this.collectionUsage = [];
  }

  /**
   * Main analysis function
   */
  analyze() {
    try {
      // Try AST analysis
      try {
        this.ast = parse(this.code);
        this.traverseAST(this.ast);
      } catch (parseError) {
        console.log('AST parsing failed, using pattern matching');
      }

      // Fallback to pattern matching if AST didn't find anything
      if (this.maxLoopDepth === 0 && !this.hasRecursion) {
        this.analyzeWithPatterns();
      }

      const result = {
        timeComplexity: this.estimateTimeComplexity(),
        spaceComplexity: this.estimateSpaceComplexity(),
        analysis: {
          maxLoopDepth: this.maxLoopDepth,
          hasRecursion: this.hasRecursion,
          recursionType: this.recursionType,
          arrayAllocations: this.arrayAllocations.length,
          collectionUsage: this.collectionUsage.length
        }
      };

      console.log('📊 Complexity Analysis Result:', result);
      return result;
    } catch (error) {
      console.error('Complexity analysis error:', error);
      return {
        timeComplexity: 'Unable to analyze',
        spaceComplexity: 'Unable to analyze',
        analysis: { error: error.message }
      };
    }
  }

  /**
   * Pattern-based analysis (fallback method)
   */
  analyzeWithPatterns() {
    console.log('🔍 Using pattern matching for complexity analysis');
    
    // Detect loops using regex patterns
    const forLoops = (this.code.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (this.code.match(/\bwhile\s*\(/g) || []).length;
    const doWhileLoops = (this.code.match(/\bdo\s*\{/g) || []).length;
    
    const totalLoops = forLoops + whileLoops + doWhileLoops;
    
    // Detect nested loops by analyzing indentation/braces
    const nestedLoopDepth = this.detectNestedLoops();
    this.maxLoopDepth = Math.max(this.maxLoopDepth, nestedLoopDepth);
    
    // Detect recursion
    const methodMatches = this.code.match(/\b(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\([^)]*\)/g);
    if (methodMatches) {
      methodMatches.forEach(methodDecl => {
        const methodName = methodDecl.match(/\s+(\w+)\s*\(/);
        if (methodName && methodName[1]) {
          const name = methodName[1];
          // Check if method calls itself
          const methodBody = this.code.substring(this.code.indexOf(methodDecl));
          const callPattern = new RegExp(`\\b${name}\\s*\\(`, 'g');
          const calls = (methodBody.match(callPattern) || []).length;
          if (calls > 1) { // More than 1 means it calls itself
            this.hasRecursion = true;
            this.recursionType = this.detectRecursionType({ code: methodBody });
          }
        }
      });
    }
    
    // Detect arrays and collections
    this.arrayAllocations = (this.code.match(/new\s+\w+\[/g) || []);
    const collectionPatterns = ['ArrayList', 'LinkedList', 'HashSet', 'TreeSet', 'HashMap', 'TreeMap', 'Stack', 'Queue'];
    collectionPatterns.forEach(coll => {
      if (this.code.includes(`new ${coll}`)) {
        this.collectionUsage.push(coll);
      }
    });
    
    console.log(`📈 Pattern Analysis: ${totalLoops} loops, depth ${this.maxLoopDepth}, recursion: ${this.hasRecursion}`);
  }

  /**
   * Detect nested loop depth
   */
  detectNestedLoops() {
    let maxDepth = 0;
    let currentDepth = 0;
    let inLoop = false;
    let braceDepth = 0;
    let loopBraceStart = [];
    
    const lines = this.code.split('\n');
    
    for (let line of lines) {
      // Check for loop keywords
      if (/\b(for|while)\s*\(/.test(line) || /\bdo\s*\{/.test(line)) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
        loopBraceStart.push(braceDepth);
      }
      
      // Track braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;
      
      // Exit loop when its closing brace is found
      if (loopBraceStart.length > 0 && braceDepth <= loopBraceStart[loopBraceStart.length - 1]) {
        loopBraceStart.pop();
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  /**
   * Traverse Abstract Syntax Tree
   */
  traverseAST(node, depth = 0, methodName = null) {
    if (!node || typeof node !== 'object') return;

    // Detect loops
    if (this.isLoopNode(node)) {
      this.loopDepth++;
      this.maxLoopDepth = Math.max(this.maxLoopDepth, this.loopDepth);
    }

    // Detect recursion
    if (node.name === 'methodDeclaration') {
      const currentMethod = this.getMethodName(node);
      this.traverseAST(node.children, depth + 1, currentMethod);
      this.loopDepth = Math.max(0, this.loopDepth - (this.isLoopNode(node) ? 1 : 0));
      return;
    }

    // Check for recursive calls
    if (node.name === 'methodInvocation' && methodName) {
      const calledMethod = this.getMethodName(node);
      if (calledMethod === methodName) {
        this.hasRecursion = true;
        this.recursionType = this.detectRecursionType(node);
      }
    }

    // Detect array/collection allocations
    if (node.name === 'arrayCreationExpression') {
      this.arrayAllocations.push(this.getArraySize(node));
    }

    if (node.name === 'classInstanceCreationExpression') {
      const className = this.getClassName(node);
      if (this.isCollection(className)) {
        this.collectionUsage.push(className);
      }
    }

    // Recursively traverse children
    if (Array.isArray(node)) {
      node.forEach(child => this.traverseAST(child, depth, methodName));
    } else if (node.children) {
      Object.values(node.children).forEach(child => {
        if (Array.isArray(child)) {
          child.forEach(c => this.traverseAST(c, depth, methodName));
        } else {
          this.traverseAST(child, depth, methodName);
        }
      });
    }

    // Reset loop depth after leaving loop
    if (this.isLoopNode(node)) {
      this.loopDepth--;
    }
  }

  /**
   * Check if node is a loop
   */
  isLoopNode(node) {
    if (!node || !node.name) return false;
    return [
      'forStatement',
      'enhancedForStatement',
      'whileStatement',
      'doStatement'
    ].includes(node.name);
  }

  /**
   * Estimate time complexity based on analysis
   */
  estimateTimeComplexity() {
    // Recursion detection
    if (this.hasRecursion) {
      if (this.recursionType === 'exponential') {
        return 'O(2^n)';
      } else if (this.recursionType === 'divide-and-conquer') {
        return 'O(n log n)';
      } else if (this.maxLoopDepth > 0) {
        return `O(n^${this.maxLoopDepth + 1})`;
      } else {
        return 'O(n)';
      }
    }

    // Loop-based complexity
    if (this.maxLoopDepth === 0) {
      return 'O(1)';
    } else if (this.maxLoopDepth === 1) {
      // Check for built-in sorting or searching
      if (this.hasSortingAlgorithm()) {
        return 'O(n log n)';
      }
      return 'O(n)';
    } else if (this.maxLoopDepth === 2) {
      return 'O(n²)';
    } else if (this.maxLoopDepth === 3) {
      return 'O(n³)';
    } else {
      return `O(n^${this.maxLoopDepth})`;
    }
  }

  /**
   * Estimate space complexity
   */
  estimateSpaceComplexity() {
    let maxSpace = 0;

    // Check array allocations
    this.arrayAllocations.forEach(size => {
      if (size === 'n' || size === 'dynamic') {
        maxSpace = Math.max(maxSpace, 1);
      }
    });

    // Check collection usage
    if (this.collectionUsage.length > 0) {
      maxSpace = Math.max(maxSpace, 1);
    }

    // Check recursion depth
    if (this.hasRecursion) {
      maxSpace = Math.max(maxSpace, 1);
    }

    if (maxSpace === 0) {
      return 'O(1)';
    } else if (maxSpace === 1) {
      return 'O(n)';
    } else {
      return `O(n^${maxSpace})`;
    }
  }

  /**
   * Helper methods
   */
  getMethodName(node) {
    try {
      if (node.children?.identifier?.[0]?.image) {
        return node.children.identifier[0].image;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  detectRecursionType(node) {
    // Simple heuristic: if multiple recursive calls = exponential
    // If dividing problem = divide-and-conquer
    const code = node.code || this.code;
    if (code.includes('/ 2') || code.includes('/ 3')) {
      return 'divide-and-conquer';
    }
    // Count recursive calls in method
    let methodCode = code;
    if (node.location?.startOffset) {
      methodCode = code.substring(node.location.startOffset, node.location?.endOffset || code.length);
    }
    const recursiveCalls = (methodCode.match(/\w+\s*\(/g) || []).length;
    return recursiveCalls >= 2 ? 'exponential' : 'linear';
  }

  getArraySize(node) {
    // Try to extract array size from node
    // This is simplified - in real scenario, analyze dimExpr
    return 'dynamic';
  }

  getClassName(node) {
    try {
      if (node.children?.typeType?.[0]?.children?.classOrInterfaceType?.[0]?.children?.identifier) {
        const identifiers = node.children.typeType[0].children.classOrInterfaceType[0].children.identifier;
        return identifiers[0].image;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  isCollection(className) {
    const collections = ['ArrayList', 'LinkedList', 'HashSet', 'TreeSet', 'HashMap', 'TreeMap', 'Stack', 'Queue'];
    return collections.includes(className);
  }

  hasSortingAlgorithm() {
    // Check for common sorting method calls
    return this.code.includes('Arrays.sort') || 
           this.code.includes('Collections.sort') ||
           this.code.includes('.sort(');
  }
}

/**
 * Quick analysis function
 */
export function analyzeComplexity(code) {
  const analyzer = new ComplexityAnalyzer(code);
  return analyzer.analyze();
}