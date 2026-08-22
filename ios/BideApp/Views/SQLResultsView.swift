import SwiftUI

struct SQLResultsView: View {
    @Environment(\.dismiss) private var dismiss
    let report: SQLRunReport
    var title: String = "SQL Results"

    var body: some View {
        NavigationStack {
            List {
                Section {
                    LabeledContent("Statements", value: "\(report.statementCount)")
                    LabeledContent("Elapsed", value: String(format: "%.1f ms", report.elapsedMilliseconds))
                }

                ForEach(report.resultSets) { result in
                    Section("Statement \(result.statementIndex)") {
                        if result.columns.isEmpty {
                            Label(
                                result.affectedRows == 1
                                    ? "1 row affected"
                                    : "\(result.affectedRows) rows affected",
                                systemImage: "checkmark.circle"
                            )
                            .foregroundStyle(.secondary)
                        } else {
                            HStack {
                                Text("\(result.rowCount) rows shown")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                if result.isTruncated {
                                    Label("First 500", systemImage: "scissors")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.secondary)
                                }
                            }
                            SQLResultTableView(result: result)
                                .listRowInsets(EdgeInsets())
                        }
                    }
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct SQLResultTableView: View {
    let result: SQLResultSet

    var body: some View {
        ScrollView([.horizontal, .vertical]) {
            LazyVStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 0) {
                    ForEach(Array(result.columns.enumerated()), id: \.offset) { _, column in
                        Text(column)
                            .font(.caption.monospaced().weight(.bold))
                            .lineLimit(1)
                            .frame(width: 150, alignment: .leading)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 7)
                            .background(.thinMaterial)
                    }
                }

                ForEach(Array(result.rows.enumerated()), id: \.offset) { rowIndex, row in
                    HStack(spacing: 0) {
                        ForEach(Array(result.columns.indices), id: \.self) { columnIndex in
                            let value = columnIndex < row.count ? row[columnIndex] : nil
                            Text(value ?? "NULL")
                                .font(.caption.monospaced())
                                .foregroundStyle(value == nil ? AnyShapeStyle(.secondary) : AnyShapeStyle(.primary))
                                .lineLimit(2)
                                .frame(width: 150, alignment: .leading)
                                .frame(minHeight: 32, alignment: .leading)
                                .padding(.horizontal, 8)
                                .background(rowIndex.isMultiple(of: 2) ? Color.clear : Color.secondary.opacity(0.05))
                        }
                    }
                    Divider()
                }
            }
        }
        .frame(minHeight: 120, idealHeight: 360, maxHeight: 520)
    }
}
