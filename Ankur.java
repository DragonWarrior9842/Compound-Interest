import java.util.ArrayList;
import java.util.Scanner;
public class Ankur {
    static void main() {
        Scanner Sc = new Scanner(System.in);
        ArrayList<Double> list = new ArrayList<>();
        for(int i = 0; ; i++) {
            int a = Sc.nextInt();
            if(a == 0) break;
            int b = Sc.nextInt();
            int c = b / 12;
            double d = b % 12;
            list.add((double)a);
            list.add((a * Math.pow(1.18, c) * (1 + d * 1.5 / 100)) - a);
            list.add(a * Math.pow(1.18, c) * (1 + d * 1.5 / 100));
        }
        int principle, interest, amount, count;
        principle = interest = amount = count = 0;
        for(int i = 0; i < list.size(); i = i + 3){
            System.out.print(++count + ") " + (int)list.get(i).doubleValue() + " + " + (int)Math.ceil(list.get(i + 1)) + " = " + (int)Math.ceil(list.get(i + 2)));
            System.out.println();
            principle += list.get(i);
            interest += list.get(i + 1);
            amount += list.get(i + 2);
        }
        System.out.println("========================");
        System.out.println(principle + " + " + interest + " = " + amount);
    }
}
