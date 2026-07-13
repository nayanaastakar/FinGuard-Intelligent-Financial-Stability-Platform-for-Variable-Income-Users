package com.finguard.api.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ForecastService {

    public List<Double> forecastLinearRegression(List<Double> series, int periods) {
        List<Double> projections = new ArrayList<>();
        if (series == null || series.isEmpty()) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        int n = series.size();
        double sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumXX = 0.0;
        for (int i = 0; i < n; i++) {
            double x = i + 1;
            double y = series.get(i);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        double denom = n * sumXX - sumX * sumX;
        double slope = denom == 0.0 ? 0.0 : (n * sumXY - sumX * sumY) / denom;
        double intercept = (sumY - slope * sumX) / n;

        for (int i = 1; i <= periods; i++) {
            projections.add(Math.max(0.0, intercept + slope * (n + i)));
        }
        return projections;
    }

    public List<Double> forecastHolt(List<Double> series, int periods) {
        List<Double> projections = new ArrayList<>();
        if (series == null || series.isEmpty()) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        int n = series.size();
        double alpha = 0.6;
        double beta = 0.4;
        double s = series.get(0);
        double b = 0.0;
        if (n > 1) {
            int limit = Math.min(n - 1, 3);
            for (int j = 0; j < limit; j++) {
                b += (series.get(j + 1) - series.get(j));
            }
            b /= limit;
        }

        for (int i = 1; i < n; i++) {
            double lastS = s;
            s = alpha * series.get(i) + (1 - alpha) * (s + b);
            b = beta * (s - lastS) + (1 - beta) * b;
        }

        for (int i = 1; i <= periods; i++) {
            projections.add(Math.max(0.0, s + i * b));
        }
        return projections;
    }

    public List<Double> forecastHoltWinters(List<Double> series, int periods) {
        int L = 12; // 12-month seasonality
        if (series == null || series.size() < L * 2) {
            return forecastHolt(series, periods); // Fallback if not enough data
        }
        
        List<Double> projections = new ArrayList<>();
        double alpha = 0.4, beta = 0.2, gamma = 0.3;
        
        double[] s = new double[L];
        double avg1 = 0.0, avg2 = 0.0;
        for (int i = 0; i < L; i++) {
            avg1 += series.get(i);
            avg2 += series.get(i + L);
        }
        avg1 /= L; avg2 /= L;
        
        double trend = (avg2 - avg1) / L;
        double level = avg2;
        
        for (int i = 0; i < L; i++) {
            s[i] = (series.get(i) / (avg1 == 0 ? 1 : avg1) + series.get(i + L) / (avg2 == 0 ? 1 : avg2)) / 2.0;
        }

        for (int i = 2 * L; i < series.size(); i++) {
            double val = series.get(i);
            double lastLevel = level;
            double seasonalFactor = s[i % L] == 0 ? 1 : s[i % L];
            level = alpha * (val / seasonalFactor) + (1 - alpha) * (level + trend);
            trend = beta * (level - lastLevel) + (1 - beta) * trend;
            s[i % L] = gamma * (val / (level == 0 ? 1 : level)) + (1 - gamma) * s[i % L];
        }

        for (int i = 1; i <= periods; i++) {
            int m = (series.size() - 1 + i) % L;
            projections.add(Math.max(0.0, (level + i * trend) * s[m]));
        }
        return projections;
    }

    public List<Double> forecastMeanReversion(List<Double> series, int periods) {
        List<Double> projections = new ArrayList<>();
        if (series == null || series.isEmpty()) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        int n = series.size();
        double lastValue = series.get(n - 1);
        double previous = n > 1 ? series.get(n - 2) : lastValue;
        double trend = lastValue - previous;
        double average = series.stream().mapToDouble(Double::doubleValue).average().orElse(lastValue);
        double persistence = 0.6;

        for (int i = 0; i < periods; i++) {
            double next = lastValue + (trend * persistence) + ((average - lastValue) * 0.1);
            projections.add(Math.max(0.0, next));
            previous = lastValue;
            lastValue = next;
            trend = lastValue - previous;
        }
        return projections;
    }

    public List<Double> forecastDoubleExponential(List<Double> series, int periods) {
        List<Double> projections = new ArrayList<>();
        if (series == null || series.isEmpty()) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        int n = series.size();
        double alpha = 0.7;
        double level = series.get(0);
        double trend = n > 1 ? series.get(1) - series.get(0) : 0.0;

        for (int i = 1; i < n; i++) {
            double value = series.get(i);
            double lastLevel = level;
            level = alpha * value + (1 - alpha) * (level + trend);
            trend = alpha * (level - lastLevel) + (1 - alpha) * trend;
        }

        for (int i = 1; i <= periods; i++) {
            projections.add(Math.max(0.0, level + trend * i));
        }
        return projections;
    }

    public List<Double> forecastCroston(List<Double> series, int periods) {
        List<Double> projections = new ArrayList<>();
        if (series == null || series.isEmpty()) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        double alpha = 0.2;
        
        double y = 0.0;
        double p = 1.0;
        int firstNonZero = -1;
        for (int i = 0; i < series.size(); i++) {
            if (series.get(i) > 0) {
                y = series.get(i);
                firstNonZero = i;
                break;
            }
        }
        
        if (firstNonZero == -1) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        double q = 1.0;
        for (int i = firstNonZero + 1; i < series.size(); i++) {
            if (series.get(i) > 0) {
                y = alpha * series.get(i) + (1 - alpha) * y;
                p = alpha * q + (1 - alpha) * p;
                q = 1.0;
            } else {
                q += 1.0;
            }
        }

        double forecast = p > 0 ? (y / p) : 0.0;
        for (int i = 0; i < periods; i++) {
            projections.add(Math.max(0.0, forecast));
        }
        return projections;
    }

    public List<Double> forecastRecentFluctuation(List<Double> series, int periods) {
        List<Double> projections = new ArrayList<>();
        if (series == null || series.isEmpty()) {
            for (int i = 0; i < periods; i++) projections.add(0.0);
            return projections;
        }

        int n = series.size();
        double lastValue = series.get(n - 1);
        if (n == 1) {
            for (int i = 0; i < periods; i++) projections.add(lastValue);
            return projections;
        }

        double recentDelta = series.get(n - 1) - series.get(n - 2);
        double priorDelta = n > 2 ? series.get(n - 2) - series.get(n - 3) : recentDelta;
        double signalDelta = (recentDelta * 0.7) + (priorDelta * 0.3);
        double momentum = 0.85;

        for (int i = 1; i <= periods; i++) {
            double next = lastValue + signalDelta * momentum;
            projections.add(Math.max(0.0, next));
            lastValue = next;
            signalDelta = signalDelta * 0.8 + recentDelta * 0.2;
        }
        return projections;
    }

    public List<Double> forecastEnsemble(List<Double> series, int periods) {
        if (series == null || series.isEmpty() || series.stream().allMatch(v -> v == 0.0)) {
            List<Double> zeros = new ArrayList<>();
            for (int i = 0; i < periods; i++) zeros.add(0.0);
            return zeros;
        }

        double wLinear = 1.0/6.0, wHolt = 1.0/6.0, wHW = 1.0/6.0, wMeanRev = 1.0/6.0, wDoubleExp = 1.0/6.0, wCroston = 1.0/6.0;
        
        if (series.size() >= 4) {
            List<Double> train = series.subList(0, series.size() - 1);
            Double actualLast = series.get(series.size() - 1);
            
            Double pLinear = forecastLinearRegression(train, 1).get(0);
            Double pHolt = forecastHolt(train, 1).get(0);
            Double pHW = forecastHoltWinters(train, 1).get(0);
            Double pMeanRev = forecastMeanReversion(train, 1).get(0);
            Double pDoubleExp = forecastDoubleExponential(train, 1).get(0);
            Double pCroston = forecastCroston(train, 1).get(0);
            
            double epsilon = 0.0001;
            double invE1 = 1.0 / (Math.abs(actualLast - pLinear) + epsilon);
            double invE2 = 1.0 / (Math.abs(actualLast - pHolt) + epsilon);
            double invE3 = 1.0 / (Math.abs(actualLast - pHW) + epsilon);
            double invE4 = 1.0 / (Math.abs(actualLast - pMeanRev) + epsilon);
            double invE5 = 1.0 / (Math.abs(actualLast - pDoubleExp) + epsilon);
            double invE6 = 1.0 / (Math.abs(actualLast - pCroston) + epsilon);
            
            double sumInv = invE1 + invE2 + invE3 + invE4 + invE5 + invE6;
            wLinear = invE1 / sumInv;
            wHolt = invE2 / sumInv;
            wHW = invE3 / sumInv;
            wMeanRev = invE4 / sumInv;
            wDoubleExp = invE5 / sumInv;
            wCroston = invE6 / sumInv;
        }

        List<Double> linear = forecastLinearRegression(series, periods);
        List<Double> holt = forecastHolt(series, periods);
        List<Double> hw = forecastHoltWinters(series, periods);
        List<Double> meanReversion = forecastMeanReversion(series, periods);
        List<Double> doubleExp = forecastDoubleExponential(series, periods);
        List<Double> croston = forecastCroston(series, periods);

        List<Double> ensemble = new ArrayList<>();
        for (int i = 0; i < periods; i++) {
            double sum = (linear.get(i) * wLinear) + 
                         (holt.get(i) * wHolt) + 
                         (hw.get(i) * wHW) + 
                         (meanReversion.get(i) * wMeanRev) + 
                         (doubleExp.get(i) * wDoubleExp) +
                         (croston.get(i) * wCroston);
            ensemble.add(Math.max(0.0, sum));
        }
        return ensemble;
    }

    public double forecastNextMonth(List<Double> series) {
        List<Double> projections = forecastEnsemble(series, 1);
        return projections.isEmpty() ? 0.0 : projections.get(0);
    }

    public List<Double> forecastEnsembleWithFluctuation(List<Double> series, int periods) {
        List<Double> ensemble = forecastEnsemble(series, periods);
        List<Double> fluctuation = forecastRecentFluctuation(series, periods);
        List<Double> combined = new ArrayList<>();
        for (int i = 0; i < periods; i++) {
            double blended = (ensemble.get(i) * 0.75) + (fluctuation.get(i) * 0.25);
            combined.add(Math.max(0.0, blended));
        }
        return combined;
    }

    public List<Double> forecastNextNMonths(List<Double> series, int periods) {
        return forecastEnsemble(series, periods);
    }
}
