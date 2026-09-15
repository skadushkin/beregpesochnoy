<?php

namespace Drupal\twigext\Twig\Extension;

use Drupal\Core\Entity\FieldableEntityInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Defines a custom Twig extension for price calculations.
 */
class CustomTwigExtension extends AbstractExtension {

    /**
     * {@inheritdoc}
     */
    public function getFunctions() {
        return [
            new TwigFunction('customPrice', [$this, 'calculateCustomPrice']),
            new TwigFunction('catalogHasPrice', [$this, 'hasCatalogPrice']),
        ];
    }

    /**
     * Есть ли у объекта реальная цена (не 0 и не пусто).
     */
    public function hasCatalogPrice($price): bool {
        if ($price === NULL || $price === '' || $price === FALSE) {
            return FALSE;
        }
        return floatval(strip_tags((string) $price)) > 0;
    }

    /**
     * Подпись «III КВАРТАЛ 2026 ГОДА» из field_okonchanie_stroitelstva.
     */
    public function constructionFinishLabel($entity): ?string {
        return self::labelFromEntity($entity);
    }

    /**
     * Custom function to calculate price.
     *
     * @param float $price
     *   The original price.
     *
     * @return float
     *   The recalculated price.
     */
    public function calculateCustomPrice($price) {
        // Пример формулы: добавляем 20% к цене.
        $numeric_price = floatval(strip_tags((string) $price));
        $first = $numeric_price * 0.3;
        $motgage = $this->calculateMortgage($numeric_price, $first, 30);
        // Выполняем расчет
        return $motgage['monthlyPayment2'];

    }

    public function calculateMortgage($x, $y, $z) {
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

    /**
     * Подпись «III КВАРТАЛ 2026 ГОДА» из field_okonchanie_stroitelstva.
     */
    public static function labelFromEntity($entity): ?string {
        if (!$entity instanceof FieldableEntityInterface || !$entity->hasField('field_okonchanie_stroitelstva')) {
            return NULL;
        }
        if ($entity->get('field_okonchanie_stroitelstva')->isEmpty()) {
            return NULL;
        }

        $item = $entity->get('field_okonchanie_stroitelstva')->first();
        $raw = '';
        if ($item) {
            if (!empty($item->date) && is_object($item->date) && method_exists($item->date, 'format')) {
                $raw = $item->date->format('Y-m-d');
            }
            else {
                $raw = (string) ($item->value ?? '');
            }
        }

        return self::formatConstructionLabel($raw);
    }

    /**
     * Значение для записи в поле Drupal из ячейки таблицы.
     *
     * @return array{storage: string, label: string}|null
     */
    public static function fromSheetCell(string $value, string $field_type = 'datetime'): ?array {
        $parsed = self::parseConstructionValue($value);
        if ($parsed === NULL) {
            return NULL;
        }

        $label = self::formatFromQuarter($parsed['year'], $parsed['quarter']);
        if ($field_type === 'datetime' || $field_type === 'daterange') {
            $storage = sprintf('%04d-%02d-01', $parsed['year'], ($parsed['quarter'] - 1) * 3 + 1);
        }
        elseif ($field_type === 'timestamp') {
            $storage = (string) gmmktime(0, 0, 0, ($parsed['quarter'] - 1) * 3 + 1, 1, $parsed['year']);
        }
        else {
            $storage = $label;
        }

        return [
            'storage' => $storage,
            'label' => $label,
            'year' => $parsed['year'],
            'quarter' => $parsed['quarter'],
        ];
    }

    public static function formatConstructionLabel(string $raw): ?string {
        $parsed = self::parseConstructionValue($raw);
        if ($parsed === NULL) {
            return NULL;
        }
        return self::formatFromQuarter($parsed['year'], $parsed['quarter']);
    }

    /**
     * @return array{year: int, quarter: int}|null
     */
    protected static function parseConstructionValue(string $value): ?array {
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
        $value = str_replace("\xc2\xa0", ' ', $value);
        if ($value === '' || $value === '-' || $value === '\\-') {
            return NULL;
        }

        if (preg_match('/(IV|III|II|I|[1-4])\s*(?:кв\.?|квартал)\.?\s*(\d{4})/ui', $value, $m)) {
            return [
                'year' => (int) $m[2],
                'quarter' => self::romanToQuarter($m[1]),
            ];
        }

        if (preg_match('/\bQ\s*([1-4])\s*[\/\-]?\s*(\d{4})/i', $value, $m)) {
            return [
                'year' => (int) $m[2],
                'quarter' => (int) $m[1],
            ];
        }

        $ts = self::constructionToTimestamp($value);
        if ($ts === NULL) {
            return NULL;
        }

        $month = (int) date('n', $ts);
        return [
            'year' => (int) date('Y', $ts),
            'quarter' => (int) ceil($month / 3),
        ];
    }

    protected static function formatFromQuarter(int $year, int $quarter): string {
        $roman = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV'][$quarter] ?? (string) $quarter;
        return $roman . ' КВАРТАЛ ' . $year . ' ГОДА';
    }

    protected static function romanToQuarter(string $value): int {
        $map = [
            'I' => 1,
            'II' => 2,
            'III' => 3,
            'IV' => 4,
            '1' => 1,
            '2' => 2,
            '3' => 3,
            '4' => 4,
        ];
        $key = mb_strtoupper(trim($value));
        return $map[$key] ?? 1;
    }

    protected static function constructionToTimestamp(string $value): ?int {
        if (preg_match('/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/', $value, $m)) {
            $ts = strtotime(sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]));
            return $ts ?: NULL;
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $value, $m)) {
            $ts = strtotime($m[0]);
            return $ts ?: NULL;
        }
        $ts = strtotime($value);
        return $ts ?: NULL;
    }
}
