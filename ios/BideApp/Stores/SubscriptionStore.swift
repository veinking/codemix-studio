import StoreKit
import SwiftUI

enum BideSubscriptionProduct {
    static let monthly = "com.bideide.ios.pro.monthly"
    static let annual = "com.bideide.ios.pro.annual"
    static let identifiers: Set<String> = [monthly, annual]
}

@MainActor
final class SubscriptionStore: ObservableObject {
    @Published private(set) var products: [Product] = []
    @Published private(set) var activeProductIDs: Set<String> = []
    @Published private(set) var isLoadingProducts = false
    @Published private(set) var isPurchasing = false
    @Published private(set) var isRestoring = false
    @Published var statusMessage: String?

    private var transactionUpdatesTask: Task<Void, Never>?

    var hasProAccess: Bool {
        !activeProductIDs.isDisjoint(with: BideSubscriptionProduct.identifiers)
    }

    init() {
        transactionUpdatesTask = Task { [weak self] in
            for await verificationResult in StoreKit.Transaction.updates {
                guard let self else { return }
                await self.processTransactionUpdate(verificationResult)
            }
        }
    }

    func prepare() async {
        await refreshEntitlements()
        await loadProducts()
    }

    func loadProducts() async {
        guard !isLoadingProducts else { return }
        isLoadingProducts = true
        defer { isLoadingProducts = false }

        do {
            products = try await Product.products(for: Array(BideSubscriptionProduct.identifiers))
                .sorted { $0.price < $1.price }
            if products.isEmpty {
                statusMessage = "bIDE Pro subscriptions are not available from the App Store right now."
            }
        } catch {
            statusMessage = "Could not load bIDE Pro subscriptions: \(error.localizedDescription)"
        }
    }

    func purchase(_ product: Product) async {
        guard BideSubscriptionProduct.identifiers.contains(product.id), !isPurchasing else { return }
        isPurchasing = true
        statusMessage = nil
        defer { isPurchasing = false }

        do {
            switch try await product.purchase() {
            case .success(let verificationResult):
                let transaction = try verified(verificationResult)
                await transaction.finish()
                await refreshEntitlements()
                statusMessage = hasProAccess ? "bIDE Pro is active on this Apple ID." : "Purchase completed. Refreshing access…"
            case .pending:
                statusMessage = "Purchase is pending App Store approval."
            case .userCancelled:
                break
            @unknown default:
                statusMessage = "The App Store returned an unknown purchase state."
            }
        } catch {
            statusMessage = "Purchase failed: \(error.localizedDescription)"
        }
    }

    func restorePurchases() async {
        guard !isRestoring else { return }
        isRestoring = true
        statusMessage = nil
        defer { isRestoring = false }

        do {
            // This is intentionally user initiated. AppStore.sync() may show the
            // system Apple ID authentication prompt.
            try await AppStore.sync()
            await refreshEntitlements()
            statusMessage = hasProAccess
                ? "bIDE Pro purchases restored."
                : "No active bIDE Pro subscription was found for this Apple ID."
        } catch {
            statusMessage = "Restore failed: \(error.localizedDescription)"
        }
    }

    func refreshEntitlements() async {
        var active: Set<String> = []

        for await verificationResult in StoreKit.Transaction.currentEntitlements {
            guard case .verified(let transaction) = verificationResult else { continue }
            guard BideSubscriptionProduct.identifiers.contains(transaction.productID) else { continue }
            active.insert(transaction.productID)
        }

        activeProductIDs = active
    }

    private func processTransactionUpdate(_ verificationResult: VerificationResult<StoreKit.Transaction>) async {
        do {
            let transaction = try verified(verificationResult)
            guard BideSubscriptionProduct.identifiers.contains(transaction.productID) else {
                await transaction.finish()
                return
            }

            await transaction.finish()
            await refreshEntitlements()
        } catch {
            statusMessage = "The App Store returned an unverified transaction."
        }
    }

    private func verified(
        _ result: VerificationResult<StoreKit.Transaction>
    ) throws -> StoreKit.Transaction {
        switch result {
        case .verified(let transaction):
            return transaction
        case .unverified:
            throw SubscriptionError.failedVerification
        }
    }
}

private enum SubscriptionError: LocalizedError {
    case failedVerification

    var errorDescription: String? {
        "The App Store transaction could not be verified."
    }
}
