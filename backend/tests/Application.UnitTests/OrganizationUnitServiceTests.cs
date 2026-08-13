 using Application.DTOs.OrganizationUnits;
using Application.Services;
using Domain.Entities;
using Domain.Interfaces;
using Moq;
using Xunit;

namespace Application.UnitTests;

public class OrganizationUnitServiceTests
{
    private readonly Mock<IRepository<OrganizationUnit>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly OrganizationUnitService _service;

    public OrganizationUnitServiceTests()
    {
        _repositoryMock = new Mock<IRepository<OrganizationUnit>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _service = new OrganizationUnitService(_repositoryMock.Object, _unitOfWorkMock.Object);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsArgumentException_WhenSettingUnitAsItsOwnParent()
    {
        // Arrange
        var unitId = Guid.NewGuid();
        var unit = new OrganizationUnit
        {
            Id = unitId,
            Name = "Engineering",
            Code = "ENG",
            ParentId = null,
            Path = $"/{unitId}/",
            Level = 0
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(unitId)).ReturnsAsync(unit);
        _repositoryMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<OrganizationUnit, bool>>>()))
            .ReturnsAsync(new List<OrganizationUnit>());

        var request = new UpdateOrganizationUnitRequest
        {
            Name = "Engineering",
            Code = "ENG",
            IsActive = true,
            ParentId = unitId // trying to set itself as its own parent
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(unitId, request));
        Assert.Contains("cannot be its own parent", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsArgumentException_WhenNewParentIsADescendant()
    {
        // Arrange: Root -> Child -> Grandchild
        var rootId = Guid.NewGuid();
        var childId = Guid.NewGuid();
        var grandchildId = Guid.NewGuid();

        var root = new OrganizationUnit
        {
            Id = rootId,
            Name = "Root",
            Code = "ROOT",
            ParentId = null,
            Path = $"/{rootId}/",
            Level = 0
        };

        var grandchild = new OrganizationUnit
        {
            Id = grandchildId,
            Name = "Grandchild",
            Code = "GRANDCHILD",
            ParentId = childId,
            Path = $"/{rootId}/{childId}/{grandchildId}/",
            Level = 2
        };

        // Trying to update ROOT to have GRANDCHILD as its parent.
        // grandchild.Path contains "/{rootId}/", so the service should block this
        // as a circular hierarchy (root would become a descendant of its own descendant).
        _repositoryMock.Setup(r => r.GetByIdAsync(rootId)).ReturnsAsync(root);
        _repositoryMock.Setup(r => r.GetByIdAsync(grandchildId)).ReturnsAsync(grandchild);
        _repositoryMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<OrganizationUnit, bool>>>()))
            .ReturnsAsync(new List<OrganizationUnit>());

        var request = new UpdateOrganizationUnitRequest
        {
            Name = "Root",
            Code = "ROOT",
            IsActive = true,
            ParentId = grandchildId // trying to set a descendant as the parent
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(rootId, request));
        Assert.Contains("circular hierarchy", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsArgumentException_WhenCodeAlreadyExistsOnAnotherUnit()
    {
        // Arrange
        var unitId = Guid.NewGuid();
        var otherUnitId = Guid.NewGuid();

        var unit = new OrganizationUnit
        {
            Id = unitId,
            Name = "Engineering",
            Code = "ENG",
            ParentId = null,
            Path = $"/{unitId}/",
            Level = 0
        };

        var conflictingUnit = new OrganizationUnit
        {
            Id = otherUnitId,
            Name = "Existing",
            Code = "DUPLICATE",
            ParentId = null,
            Path = $"/{otherUnitId}/",
            Level = 0
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(unitId)).ReturnsAsync(unit);
        _repositoryMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<OrganizationUnit, bool>>>()))
            .ReturnsAsync(new List<OrganizationUnit> { conflictingUnit });

        var request = new UpdateOrganizationUnitRequest
        {
            Name = "Engineering",
            Code = "DUPLICATE", // already used by another unit
            IsActive = true,
            ParentId = null
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(unitId, request));
        Assert.Contains("already exists", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_ThrowsArgumentException_WhenRootAlreadyExists()
    {
        // Arrange
        var existingRootId = Guid.NewGuid();
        var existingRoot = new OrganizationUnit
        {
            Id = existingRootId,
            Name = "Existing Root",
            Code = "ROOT1",
            ParentId = null,
            Path = $"/{existingRootId}/",
            Level = 0
        };

        // CreateAsync calls FindAsync twice: first to check for a duplicate code
        // (should find none), then to check for an existing root (should find one).
        // SetupSequence returns results in that exact call order.
        _repositoryMock.SetupSequence(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<OrganizationUnit, bool>>>()))
            .ReturnsAsync(new List<OrganizationUnit>())
            .ReturnsAsync(new List<OrganizationUnit> { existingRoot });

        var request = new CreateOrganizationUnitRequest
        {
            Name = "Another Root",
            Code = "ROOT2",
            ParentId = null // trying to create a second root
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(request));
        Assert.Contains("root organization unit already exists", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_ThrowsArgumentException_WhenParentIsInactive()
    {
        // Arrange
        var parentId = Guid.NewGuid();
        var inactiveParent = new OrganizationUnit
        {
            Id = parentId,
            Name = "Inactive Dept",
            Code = "INACTIVE",
            ParentId = null,
            Path = $"/{parentId}/",
            Level = 0,
            IsActive = false
        };

        _repositoryMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<OrganizationUnit, bool>>>()))
            .ReturnsAsync(new List<OrganizationUnit>());
        _repositoryMock.Setup(r => r.GetByIdAsync(parentId)).ReturnsAsync(inactiveParent);

        var request = new CreateOrganizationUnitRequest
        {
            Name = "New Child",
            Code = "CHILD1",
            ParentId = parentId
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(request));
        Assert.Contains("inactive", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}