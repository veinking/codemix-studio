import Foundation
import XCTest
@testable import bIDE

final class Build12CorruptExportRegressionTests: XCTestCase {
    private let hardwareArtifactLF = """
    customer_id,customer_name,state,segment,signup_date
    C001,Avery Brooks,VA,Small Business,2026-01-08
    C002,Jordan Lee,MD,Consumer,2026-01-14
    C003,Morgan Reed,DC,Enterprise,2026-01-22
    C004,Cameron Diaz,VA_2,Consumer_2,2026-02-03
    C005,Riley Chen,NC,Small Business_2,2026-02-11
    C006,Taylor Morgan,VA_3,Enterprise_2,2026-02-19
    C007,Parker James,MD_2,Consumer_3,2026-03-01
    C008,Casey Patel,DC_2,Small Business_3,2026-03-12
    C009,Drew Wilson,VA_4,Consumer_4,2026-03-23
    C010,Quinn Davis,NC_2,Enterprise_3,2026-04-02
    C011,Skyler Adams,VA_5,Small Business_4,2026-04-14
    C012,Reese Thompson,MD_3,Consumer_5,2026-04-28
    C013,Emerson Clark,DC_3,Enterprise_4,2026-05-09
    C014,Rowan Lewis,VA_6,Consumer_6,2026-05-21
    C015,Finley Scott,NC_3,Small Business_5,2026-06-04,order_id,customer_id,order_date,product,quantity,order_total,status
    O1001,C001,2026-05-03,Starter Plan,1,49.0,Paid
    O1002,C002,2026-05-05,Data Export,2,30.0,Paid
    O1003,C003,2026-05-07,Pro Plan,1_2,199.0,Paid
    O1004,C001_2,2026-05-18,Data Export_2,1_3,15.0,Paid
    O1005,C004,2026-05-21,Starter Plan_2,1_4,49.0_2,Refunded
    O1006,C005,2026-05-23,Pro Plan_2,1_5,199.0_2,Paid
    O1007,C006,2026-05-27,Team Seats,4,120.0,Paid
    O1008,C007,2026-06-02,Starter Plan_3,1_6,49.0_3,Pending
    O1009,C003_2,2026-06-04,Team Seats_2,3,90.0,Paid
    O1010,C008,2026-06-08,Data Export_3,3_2,45.0,Paid
    O1011,C009,2026-06-11,Starter Plan_4,1_7,49.0_4,Paid
    O1012,C010,2026-06-15,Pro Plan_3,1_8,199.0_3,Paid
    O1013,C001_3,2026-06-19,Team Seats_3,2_2,60.0,Paid
    O1014,C006_2,2026-06-22,Pro Plan_4,1_9,199.0_4,Paid
    O1015,C011,2026-06-26,Starter Plan_5,1_10,49.0_5,Cancelled
    O1016,C002_2,2026-07-01,Team Seats_4,2_3,60.0_2,Paid
    O1017,C005_2,2026-07-06,Data Export_4,5,75.0,Paid
    O1018,C007_2,2026-07-10,Starter Plan_6,1_11,49.0_6,Paid
    O1019,C008_2,2026-07-14,Pro Plan_5,1_12,199.0_5,Paid
    O1020,C010_2,2026-07-18,Team Seats_5,6,180.0,Paid
    O1021,C003_3,2026-07-22,Data Export_5,2_4,30.0_2,Paid
    O1022,C004_2,2026-07-26,Starter Plan_7,1_13,49.0_7,Paid
    O1023,C009_2,2026-08-02,Pro Plan_6,1_14,199.0_6,Paid
    O1024,C001_4,2026-08-05,Data Export_6,4_2,60.0_3,Paid
    O1025,C999,2026-08-09,Starter Plan_8,1_15,49.0_8,Paid
    O1026,C888,2026-08-12,Pro Plan_7,1_16,199.0_7,Pending
    O1027,C012,2026-08-16,Data Export_7,2_5,30.00,Paid
    """

    func testBuild12HardwareArtifactIsRejectedInsteadOfReinterpretedAsOneDataset() throws {
        let manager = FileManager.default
        let url = manager.temporaryDirectory
            .appendingPathComponent("bide_query_result_build12_hardware.csv")
        defer { try? manager.removeItem(at: url) }

        let crlfArtifact = hardwareArtifactLF.replacingOccurrences(of: "\n", with: "\r\n")
        try crlfArtifact.write(to: url, atomically: true, encoding: .utf8)

        XCTAssertTrue(crlfArtifact.contains("VA_2"))
        XCTAssertTrue(crlfArtifact.contains("C001_2"))
        XCTAssertTrue(crlfArtifact.contains("2026-06-04,order_id,customer_id,order_date,product,quantity,order_total,status"))

        XCTAssertThrowsError(try DatasetParser.parse(url: url, format: .csv)) { error in
            guard case DatasetParserError.malformedDelimited(let message) = error else {
                XCTFail("Expected malformedDelimited, got \(error)")
                return
            }
            XCTAssertTrue(message.contains("structurally inconsistent"))
            XCTAssertTrue(message.contains("12 fields"))
            XCTAssertTrue(message.contains("header declares 5"))
        }
    }
}
