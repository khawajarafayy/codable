import { analyzeComplexity } from './src/utils/complexityAnalyzer.js';

console.log('=== Testing Complexity Analyzer ===\n');

// Test 1: O(1) - Constant time
const test1 = `
public class Test {
    public static int add(int a, int b) {
        return a + b;
    }
}
`;
console.log('Test 1 - O(1) Constant:');
console.log(analyzeComplexity(test1));
console.log('\n---\n');

// Test 2: O(n) - Single loop
const test2 = `
public class Test {
    public static void printArray(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            System.out.println(arr[i]);
        }
    }
}
`;
console.log('Test 2 - O(n) Single Loop:');
console.log(analyzeComplexity(test2));
console.log('\n---\n');

// Test 3: O(n²) - Nested loops
const test3 = `
public class Test {
    public static void bubbleSort(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < arr.length - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}
`;
console.log('Test 3 - O(n²) Nested Loops:');
console.log(analyzeComplexity(test3));
console.log('\n---\n');

// Test 4: O(n) with recursion
const test4 = `
public class Test {
    public static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
}
`;
console.log('Test 4 - O(n) Recursion:');
console.log(analyzeComplexity(test4));
console.log('\n---\n');

// Test 5: O(n) with ArrayList
const test5 = `
public class Test {
    public static void test() {
        ArrayList<Integer> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            list.add(i);
        }
    }
}
`;
console.log('Test 5 - O(n) with ArrayList (Space O(n)):');
console.log(analyzeComplexity(test5));
console.log('\n---\n');
