<?php

function calculateMortgage($x, $y, $z=30) {
    $mortgageAmount = $x - $y; // сумма ипотеки, которую нужно вернуть
    $interestRate1 = 0.231; // ставка 5.5%
    $interestRate2 = 0.06; // ставка 4.5%
    $interestRate = $interestRate1; // начинаем со ставки 5.5%
    $paymentsPerYear = 12; // ежемесячные платежи
    $totalPayments = $z * $paymentsPerYear; // общее количество платежей

    $monthlyInterestRate1 = $interestRate1 / $paymentsPerYear; // месячная ставка 5.5%
    $monthlyInterestRate2 = $interestRate2 / $paymentsPerYear; // месячная ставка 4.5%

    // Рассчитываем ежемесячный платеж для каждой ставки
    $monthlyPayment1 = ($mortgageAmount * $monthlyInterestRate1) / (1 - pow(1 + $monthlyInterestRate1, -$totalPayments));
    $monthlyPayment2 = ($mortgageAmount * $monthlyInterestRate2) / (1 - pow(1 + $monthlyInterestRate2, -$totalPayments));

    $totalPayment1 = $monthlyPayment1 * $totalPayments; // общая сумма выплат по ставке 5.5%
    $totalPayment2 = $monthlyPayment2 * $totalPayments; // общая сумма выплат по ставке 4.5%

    $totalInterest1 = $totalPayment1 - $mortgageAmount; // общая сумма переплаты по ставке 5.5%
    $totalInterest2 = $totalPayment2 - $mortgageAmount; // общая сумма переплаты по ставке 4.5%

    $monthlyPayment = $monthlyPayment1;
    $totalPayment = $totalPayment1;
//    $totalInterest = $totalInterest1;

    $monthlyPayment2 = $monthlyPayment2;
    $totalPayment2 = $totalPayment2;
//    $totalInterest2 = $totalInterest2;
//    $interestRate2 = $interestRate2;


    return array(
        'monthlyPayment' => ceil($monthlyPayment),
        'monthlyPayment2' => ceil($monthlyPayment2),
        'totalPayment' => ceil($totalPayment-$mortgageAmount),
        'totalPayment2' => ceil($totalPayment2-$mortgageAmount),
        'pereplata1' => ceil($monthlyPayment - $monthlyPayment2),
        'pereplata2' => ceil($totalPayment - $totalPayment2),
//        'interestRate' => $interestRate
    );
}
// Пример использования функции
if(empty($_POST['down_payment'])) $_POST['down_payment'] = $_POST['mortgage_amount']*0.5;
if(empty($_POST['mortgage_term'])) $_POST['mortgage_term'] = 30;
$result = calculateMortgage($_POST['mortgage_amount'], $_POST['down_payment'], $_POST['mortgage_term']);
echo json_encode($result);

