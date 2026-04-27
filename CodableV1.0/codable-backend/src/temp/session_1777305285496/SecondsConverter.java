import java.util.Scanner;

public class SecondsConverter {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        // Take input in seconds
        System.out.print("Enter number of seconds: ");
        int seconds = input.nextInt();

        // Convert seconds to minutes and remaining seconds
        int minutes = seconds / 60;
        int remainingSeconds = seconds % 60;

        // Display result
        System.out.println(seconds + " seconds is " + minutes + " minutes and " + remainingSeconds + " seconds");

        input.close();
    }
}