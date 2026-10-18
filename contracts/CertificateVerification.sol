// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateVerification {

    address public owner;

    struct Certificate {
        string certificateId;
        string studentName;
        string registrationNumber;
        string course;
        string issueDate;
        string certificateHash;
        bool exists;
    }

    mapping(string => Certificate) private certificates;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can add certificates");
        _;
    }

    function addCertificate(
        string memory _certificateId,
        string memory _studentName,
        string memory _registrationNumber,
        string memory _course,
        string memory _issueDate,
        string memory _certificateHash
    ) public onlyOwner {
        certificates[_certificateId] = Certificate(
            _certificateId,
            _studentName,
            _registrationNumber,
            _course,
            _issueDate,
            _certificateHash,
            true
        );
    }

    function verifyCertificate(
        string memory _certificateId,
        string memory _certificateHash
    ) public view returns (bool) {
        return certificates[_certificateId].exists &&
               keccak256(bytes(certificates[_certificateId].certificateHash)) ==
               keccak256(bytes(_certificateHash));
    }

    function getCertificate(
        string memory _certificateId
    ) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory
    ) {
        Certificate memory certificate = certificates[_certificateId];

        return (
            certificate.certificateId,
            certificate.studentName,
            certificate.registrationNumber,
            certificate.course,
            certificate.issueDate,
            certificate.certificateHash
        );
    }
}