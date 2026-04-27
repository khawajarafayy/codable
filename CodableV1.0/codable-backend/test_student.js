import { spawn } from "child_process";
import fs from "fs";

const code = `import java.util.Scanner;

public class FullName {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        // Taking input
        System.out.print("Enter first name: ");
        String firstName = input.nextLine();

        System.out.print("Enter middle name: ");
        String middleName = input.nextLine();

        System.out.print("Enter last name: ");
        String lastName = input.nextLine();

        // Display full name
        System.out.println("Full Name: " + firstName + " " + middleName + " " + lastName);

        input.close();
    }
}`;

fs.writeFileSync("FullName.java", code);

const javac = spawn("javac", ["FullName.java"]);
javac.on("close", (code) => {
    if (code !== 0) {
        console.error("Compilation failed");
        process.exit(1);
    }
    
    const java = spawn("java", ["FullName"]);
    let stdout = "";
    let stderr = "";
    
    java.stdout.on("data", d => stdout += d.toString());
    java.stderr.on("data", d => stderr += d.toString());
    
    java.on("close", (code) => {
        console.log("Exit code:", code);
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);
        process.exit(0);
    });
    
    java.stdin.write("John\nMichael\nDoe\n");
    java.stdin.end();
});
